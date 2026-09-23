const express = require('express');
const {
  ARCHIVE_FILENAME,
  buildTagSummary,
  generateTagArchive
} = require('../services/tagArchive');

const router = express.Router();

// GET /api/tags - All unique tags plus the latest summary (counts, entries)
router.get('/', (req, res) => {
  try {
    const summary = buildTagSummary();
    res.json({
      tags: summary.tags,
      counts: summary.counts,
      entries: summary.entries,
      summary: {
        totalTags: summary.totalTags,
        totalArticles: summary.totalArticles,
        generatedAt: summary.generatedAt,
        archiveFile: ARCHIVE_FILENAME
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// GET /api/tags/archive - Download the tag summary archive.
// Regenerated on every request and written to one fixed path, so repeated
// downloads always overwrite the same complete snapshot.
router.get('/archive', (req, res) => {
  try {
    const { filePath } = generateTagArchive();
    res.download(filePath, ARCHIVE_FILENAME, err => {
      // An aborted transfer leaves the server-side archive intact; the
      // client simply retries against the same complete file.
      if (err && !res.headersSent) {
        console.error('Tag archive download failed:', err.message);
        res.status(500).json({ error: 'Failed to download tag archive' });
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate tag archive' });
  }
});

module.exports = router;
