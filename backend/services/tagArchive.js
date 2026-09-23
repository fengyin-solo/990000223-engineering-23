const fs = require('fs');
const path = require('path');
const { getDb } = require('../db/init');

// The archive always lives at one fixed path: regenerating overwrites the
// same file instead of accumulating timestamped duplicates.
const ARCHIVE_DIR = path.join(__dirname, '..', 'data');
const ARCHIVE_FILENAME = 'tags-archive.json';
const ARCHIVE_PATH = path.join(ARCHIVE_DIR, ARCHIVE_FILENAME);

// Build a stable snapshot of every tag: sorted tag list, per-tag article
// counts and navigation entries. Same data always yields the same shape,
// including when there are no tags at all.
function buildTagSummary() {
  const db = getDb();
  const articles = db
    .prepare("SELECT tags FROM articles WHERE tags IS NOT NULL AND tags != ''")
    .all();

  const counts = {};
  articles.forEach(article => {
    article.tags.split(',').forEach(tag => {
      const trimmed = tag.trim();
      if (trimmed) {
        counts[trimmed] = (counts[trimmed] || 0) + 1;
      }
    });
  });

  const tags = Object.keys(counts).sort();
  const entries = tags.map(tag => ({
    tag,
    count: counts[tag],
    url: `/?tag=${encodeURIComponent(tag)}`
  }));

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    totalTags: tags.length,
    totalArticles: db.prepare('SELECT COUNT(*) AS total FROM articles').get().total,
    tags,
    counts,
    entries
  };
}

// Remove temp files left behind by an interrupted previous write.
function cleanStaleTempFiles() {
  let files;
  try {
    files = fs.readdirSync(ARCHIVE_DIR);
  } catch (err) {
    return;
  }
  files
    .filter(name => name.startsWith(`${ARCHIVE_FILENAME}.`) && name.endsWith('.tmp'))
    .forEach(name => {
      try {
        fs.unlinkSync(path.join(ARCHIVE_DIR, name));
      } catch (err) {
        // best effort only
      }
    });
}

// Write the archive atomically: serialize to a temp file, then rename over
// the target. A crash or interrupted download can leave a stray .tmp file
// but never a half-written archive, and the next generation cleans it up.
function writeTagArchive(summary) {
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  cleanStaleTempFiles();

  const tmpPath = `${ARCHIVE_PATH}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(summary, null, 2) + '\n', 'utf8');
  fs.renameSync(tmpPath, ARCHIVE_PATH);
  return ARCHIVE_PATH;
}

// Regenerate the archive from the current database state, overwriting the
// single existing result.
function generateTagArchive() {
  const summary = buildTagSummary();
  const filePath = writeTagArchive(summary);
  return { summary, filePath };
}

module.exports = {
  ARCHIVE_FILENAME,
  ARCHIVE_PATH,
  buildTagSummary,
  generateTagArchive
};
