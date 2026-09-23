const fs = require('fs');
const path = require('path');
const { getDb } = require('../db/init');

const DATA_DIR = path.join(__dirname, '..', 'data');
const ARCHIVE_PATH = path.join(DATA_DIR, 'tags-archive.json');

// Collect tag statistics from all articles: Map<tag, articleCount>.
// A tag repeated within one article is only counted once for that article.
function collectTagStats(db) {
  const articles = db.prepare("SELECT tags FROM articles WHERE tags IS NOT NULL AND tags != ''").all();
  const stats = new Map();

  articles.forEach(article => {
    if (!article.tags) return;
    const seenInArticle = new Set();
    article.tags.split(',').forEach(tag => {
      const trimmed = tag.trim();
      if (trimmed && !seenInArticle.has(trimmed)) {
        seenInArticle.add(trimmed);
        stats.set(trimmed, (stats.get(trimmed) || 0) + 1);
      }
    });
  });

  return stats;
}

// Build the tag summary snapshot: tag entries (with filter links), the total
// tag count and the full tag list. Works for an empty tag set as well.
function buildTagSummary() {
  const db = getDb();
  const stats = collectTagStats(db);
  const tags = Array.from(stats.keys()).sort();

  return {
    generated_at: new Date().toISOString(),
    tag_count: tags.length,
    tags,
    entries: tags.map(tag => ({
      tag,
      article_count: stats.get(tag),
      url: `/?tag=${encodeURIComponent(tag)}`
    }))
  };
}

// Read the existing archive, returning null when it is missing or unreadable.
function readExistingArchive() {
  try {
    return JSON.parse(fs.readFileSync(ARCHIVE_PATH, 'utf8'));
  } catch (err) {
    return null;
  }
}

// Two summaries describe the same snapshot when everything but the
// generation timestamp matches.
function isSameSummary(a, b) {
  if (!a || !b) return false;
  return a.tag_count === b.tag_count
    && JSON.stringify(a.tags) === JSON.stringify(b.tags)
    && JSON.stringify(a.entries) === JSON.stringify(b.entries);
}

// Regenerate the archive at a fixed path. When the tag data has not changed
// the existing file is left untouched, so the snapshot stays byte-stable and
// an interrupted download can safely be resumed. When the data has changed,
// the new content is written to a temp file first and then renamed into
// place, so readers never see a partial file and repeated runs overwrite the
// same archive instead of piling up duplicates.
function refreshTagArchive() {
  const summary = buildTagSummary();
  const existing = readExistingArchive();

  if (isSameSummary(existing, summary)) {
    return existing;
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmpPath = `${ARCHIVE_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(summary, null, 2));
  fs.renameSync(tmpPath, ARCHIVE_PATH);

  return summary;
}

// Make sure the archive exists (e.g. first run after deploy), generating it
// only when missing.
function ensureTagArchive() {
  if (!fs.existsSync(ARCHIVE_PATH)) {
    refreshTagArchive();
  }
  return ARCHIVE_PATH;
}

module.exports = {
  ARCHIVE_PATH,
  buildTagSummary,
  refreshTagArchive,
  ensureTagArchive
};
