const fs = require('fs')
const path = require('path')
const db = require('./db')

const CONTENT_PREFIX = '/api/uploads/post-images/'
const TITLE_PREFIX = '/api/uploads/post-title-images/'
const UPLOAD_PREFIXES = [CONTENT_PREFIX, TITLE_PREFIX]

function sqlContentToUtf8(value) {
  if (value == null) {
    return ''
  }
  if (Buffer.isBuffer(value)) {
    return value.toString('utf8')
  }
  if (typeof value === 'string') {
    return value
  }
  return String(value)
}

function normalizeMediaUrl(raw) {
  let u = String(raw || '').trim()
  if (!u) {
    return null
  }
  u = u.replace(/^https?:\/\/[^/]+/i, '')
  if (!u.startsWith('/')) {
    u = `/${u.replace(/^\/+/, '')}`
  }
  u = u.split('?')[0].split('#')[0]
  if (UPLOAD_PREFIXES.some((prefix) => u.startsWith(prefix))) {
    return u
  }
  return null
}

function mediaKindFromUrl(url) {
  return String(url || '').startsWith(TITLE_PREFIX) ? 'title' : 'content'
}

function filenameFromUrl(url) {
  return path.basename(String(url || '')) || 'unknown'
}

/**
 * Trích xuất mọi ảnh upload từ HTML (post, landing).
 * @returns {{ url: string, kind: 'content'|'title', filename: string, alt: string|null, title: string|null }[]}
 */
function extractImagesFromHtml(html) {
  if (!html || typeof html !== 'string') {
    return []
  }
  const seen = new Set()
  const out = []
  const tagRe = /<img\b[^>]*>/gi
  let m
  while ((m = tagRe.exec(html)) !== null) {
    const tag = m[0]
    const srcMatch = /\bsrc\s*=\s*(["'])([^"']+)\1/i.exec(tag)
    if (!srcMatch) {
      continue
    }
    const url = normalizeMediaUrl(srcMatch[2])
    if (!url || seen.has(url)) {
      continue
    }
    seen.add(url)
    const altMatch = /\balt\s*=\s*(["'])([^"']*)\1/i.exec(tag)
    const titleMatch = /\btitle\s*=\s*(["'])([^"']*)\1/i.exec(tag)
    out.push({
      url,
      kind: mediaKindFromUrl(url),
      filename: filenameFromUrl(url),
      alt: altMatch ? altMatch[2] : null,
      title: titleMatch ? titleMatch[2] : null
    })
  }
  return out
}

async function upsertMediaAsset(conn, { url, kind, filename, alt, title }) {
  const altText = alt != null ? String(alt).trim().slice(0, 500) || null : null
  const titleAttr = title != null ? String(title).trim().slice(0, 500) || null : null
  await conn.query(
    `INSERT INTO media_assets (url, kind, filename, alt_text, title_attr)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       kind = VALUES(kind),
       filename = VALUES(filename),
       alt_text = COALESCE(NULLIF(media_assets.alt_text, ''), VALUES(alt_text)),
       title_attr = COALESCE(NULLIF(media_assets.title_attr, ''), VALUES(title_attr))`,
    [url, kind, filename, altText, titleAttr]
  )
}

async function registerMediaAssetsFromHtml(conn, html) {
  for (const img of extractImagesFromHtml(html)) {
    await upsertMediaAsset(conn, img)
  }
}

async function registerMediaAssetByUrl(conn, rawUrl, kindOverride = null) {
  const url = normalizeMediaUrl(rawUrl)
  if (!url) {
    return
  }
  await upsertMediaAsset(conn, {
    url,
    kind: kindOverride || mediaKindFromUrl(url),
    filename: filenameFromUrl(url),
    alt: null,
    title: null
  })
}

async function syncMediaFromPostsAndLanding(conn) {
  const [posts] = await conn.query('SELECT content, title_image FROM posts')
  for (const row of posts) {
    const html = sqlContentToUtf8(row.content)
    await registerMediaAssetsFromHtml(conn, html)
    if (row.title_image) {
      await registerMediaAssetByUrl(conn, row.title_image, 'title')
    }
  }

  const [landings] = await conn.query('SELECT content FROM landing_pages')
  for (const row of landings) {
    await registerMediaAssetsFromHtml(conn, sqlContentToUtf8(row.content))
  }
}

/** Backfill alt từ bảng post_images (dữ liệu cũ). */
async function syncMediaFromPostImagesTable(conn) {
  try {
    const [rows] = await conn.query(
      `SELECT url, alt_text FROM post_images
       WHERE url IS NOT NULL AND url <> ''`
    )
    for (const row of rows) {
      const url = normalizeMediaUrl(row.url)
      if (!url) {
        continue
      }
      await upsertMediaAsset(conn, {
        url,
        kind: mediaKindFromUrl(url),
        filename: filenameFromUrl(url),
        alt: row.alt_text,
        title: null
      })
    }
  } catch (e) {
    if (e.code !== 'ER_NO_SUCH_TABLE') {
      throw e
    }
  }
}

async function syncMediaFromDisk(postImagesDir, postTitleImagesDir) {
  for (const filename of listFilesInDir(postImagesDir)) {
    const url = `${CONTENT_PREFIX}${filename}`
    await db.query(
      `INSERT INTO media_assets (url, kind, filename)
       VALUES (?, 'content', ?)
       ON DUPLICATE KEY UPDATE filename = VALUES(filename)`,
      [url, filename]
    )
  }
  for (const filename of listFilesInDir(postTitleImagesDir)) {
    const url = `${TITLE_PREFIX}${filename}`
    await db.query(
      `INSERT INTO media_assets (url, kind, filename)
       VALUES (?, 'title', ?)
       ON DUPLICATE KEY UPDATE filename = VALUES(filename)`,
      [url, filename]
    )
  }
}

/** Quét disk + posts + landing + post_images → media_assets. */
async function syncMediaAll(postImagesDir, postTitleImagesDir) {
  await syncMediaFromDisk(postImagesDir, postTitleImagesDir)
  const conn = await db.getConnection()
  try {
    await syncMediaFromPostsAndLanding(conn)
    await syncMediaFromPostImagesTable(conn)
  } finally {
    conn.release()
  }
}

async function registerMediaAssetsFromPost(conn, { content, titleImage }) {
  if (content) {
    await registerMediaAssetsFromHtml(conn, content)
  }
  if (titleImage) {
    await registerMediaAssetByUrl(conn, titleImage, 'title')
  }
}

async function registerMediaAssetsFromLanding(conn, content) {
  if (content) {
    await registerMediaAssetsFromHtml(conn, content)
  }
}

async function tableExists(conn, table) {
  const [rows] = await conn.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
     LIMIT 1`,
    [table]
  )
  return rows.length > 0
}

async function ensureMediaAssetsTable() {
  const conn = await db.getConnection()
  try {
    const exists = await tableExists(conn, 'media_assets')
    if (!exists) {
      await conn.query(`
        CREATE TABLE media_assets (
          id INT AUTO_INCREMENT PRIMARY KEY,
          url VARCHAR(1000) NOT NULL,
          kind ENUM('content', 'title') NOT NULL DEFAULT 'content',
          filename VARCHAR(255) NOT NULL,
          alt_text VARCHAR(500) NULL,
          title_attr VARCHAR(500) NULL,
          caption VARCHAR(500) NULL,
          created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_media_assets_url (url(768)),
          KEY idx_media_assets_kind (kind),
          KEY idx_media_assets_updated (updated_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `)
      console.log('[mediaSchema] Created table media_assets')
    }
  } finally {
    conn.release()
  }
}

function listFilesInDir(dir) {
  if (!fs.existsSync(dir)) {
    return []
  }
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .filter((name) => !name.startsWith('.'))
}

async function registerMediaAsset({ url, kind, filename }) {
  await db.query(
    `INSERT INTO media_assets (url, kind, filename)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE kind = VALUES(kind), filename = VALUES(filename)`,
    [url, kind, filename]
  )
}

function toMediaDto(row) {
  const created = row.created_at
  const updated = row.updated_at
  return {
    id: row.id,
    url: row.url,
    kind: row.kind,
    filename: row.filename,
    altText: row.alt_text || '',
    titleAttr: row.title_attr || '',
    caption: row.caption || '',
    createdAt: created ? new Date(created).toISOString() : null,
    updatedAt: updated ? new Date(updated).toISOString() : null
  }
}

async function listMediaAssets({ kind } = {}) {
  let sql = `SELECT id, url, kind, filename, alt_text, title_attr, caption, created_at, updated_at
             FROM media_assets`
  const params = []
  if (kind === 'content' || kind === 'title') {
    sql += ' WHERE kind = ?'
    params.push(kind)
  }
  sql += ' ORDER BY updated_at DESC, id DESC'
  const [rows] = await db.query(sql, params)
  return rows.map(toMediaDto)
}

async function getMediaAssetById(id) {
  const [rows] = await db.query(
    `SELECT id, url, kind, filename, alt_text, title_attr, caption, created_at, updated_at
     FROM media_assets WHERE id = ?`,
    [id]
  )
  return rows.length ? toMediaDto(rows[0]) : null
}

async function updateMediaAsset(id, { altText, titleAttr, caption }) {
  const fields = []
  const vals = []
  if (altText !== undefined) {
    fields.push('alt_text = ?')
    vals.push(String(altText).trim().slice(0, 500) || null)
  }
  if (titleAttr !== undefined) {
    fields.push('title_attr = ?')
    vals.push(String(titleAttr).trim().slice(0, 500) || null)
  }
  if (caption !== undefined) {
    fields.push('caption = ?')
    vals.push(String(caption).trim().slice(0, 500) || null)
  }
  if (fields.length === 0) {
    return getMediaAssetById(id)
  }
  vals.push(id)
  const [r] = await db.query(`UPDATE media_assets SET ${fields.join(', ')} WHERE id = ?`, vals)
  if (r.affectedRows === 0) {
    return null
  }
  return getMediaAssetById(id)
}

module.exports = {
  CONTENT_PREFIX,
  TITLE_PREFIX,
  ensureMediaAssetsTable,
  syncMediaFromDisk,
  syncMediaAll,
  extractImagesFromHtml,
  normalizeMediaUrl,
  registerMediaAsset,
  registerMediaAssetsFromPost,
  registerMediaAssetsFromLanding,
  listMediaAssets,
  getMediaAssetById,
  updateMediaAsset,
  toMediaDto
}
