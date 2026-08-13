const db = require('./db')
const { slugify } = require('./postSchema')

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
     LIMIT 1`,
    [table]
  )
  return rows.length > 0
}

async function ensureLandingPagesTable() {
  const conn = await db.getConnection()
  try {
    const exists = await tableExists(conn, 'landing_pages')
    if (!exists) {
      await conn.query(`
        CREATE TABLE landing_pages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL,
          content MEDIUMTEXT NOT NULL,
          meta_title VARCHAR(255) NULL,
          meta_description VARCHAR(500) NULL,
          status TINYINT NOT NULL DEFAULT 1,
          created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_landing_pages_slug (slug)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `)
      console.log('[landingPageSchema] Created table landing_pages')
    }
  } finally {
    conn.release()
  }
}

async function resolveUniqueLandingSlug(conn, rawSlug, excludeId = null) {
  const base = slugify(rawSlug) || 'landing'
  let candidate = base
  let n = 2
  for (;;) {
    const params = excludeId != null ? [candidate, excludeId] : [candidate]
    const sql =
      excludeId != null
        ? 'SELECT id FROM landing_pages WHERE slug = ? AND id <> ? LIMIT 1'
        : 'SELECT id FROM landing_pages WHERE slug = ? LIMIT 1'
    const [dup] = await conn.query(sql, params)
    if (dup.length === 0) {
      return candidate
    }
    candidate = `${base}-${n}`
    n += 1
  }
}

module.exports = { ensureLandingPagesTable, resolveUniqueLandingSlug, slugify }
