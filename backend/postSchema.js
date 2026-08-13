const db = require('./db')

function slugify(text) {
  return String(text || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [table, column]
  )
  return rows.length > 0
}

async function ensurePostSeoColumns() {
  const conn = await db.getConnection()
  try {
    const specs = [
      { name: 'slug', ddl: 'ADD COLUMN slug VARCHAR(255) NULL UNIQUE AFTER title' },
      { name: 'meta_title', ddl: 'ADD COLUMN meta_title VARCHAR(255) NULL AFTER excerpt' },
      { name: 'meta_description', ddl: 'ADD COLUMN meta_description VARCHAR(500) NULL AFTER meta_title' }
    ]
    for (const spec of specs) {
      const exists = await columnExists(conn, 'posts', spec.name)
      if (!exists) {
        await conn.query(`ALTER TABLE posts ${spec.ddl}`)
        console.log(`[postSchema] Added column posts.${spec.name}`)
      }
    }

    const [rows] = await conn.query('SELECT id, title, slug FROM posts WHERE slug IS NULL OR slug = ""')
    for (const row of rows) {
      const base = slugify(row.title) || `post-${row.id}`
      let candidate = base
      let n = 2
      for (;;) {
        const [dup] = await conn.query('SELECT id FROM posts WHERE slug = ? AND id <> ? LIMIT 1', [
          candidate,
          row.id
        ])
        if (dup.length === 0) {
          break
        }
        candidate = `${base}-${n}`
        n += 1
      }
      await conn.query('UPDATE posts SET slug = ? WHERE id = ?', [candidate, row.id])
    }
  } finally {
    conn.release()
  }
}

module.exports = { ensurePostSeoColumns, slugify }
