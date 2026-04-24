/** URL prefix stored in HTML for body images (must match static mount in server.js) */
const POST_IMAGE_URL_PREFIX = '/api/uploads/post-images/'

/**
 * @param {string} html
 * @returns {{ url: string, alt: string | null }[]}
 */
function extractPostImageRows(html) {
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
    const url = String(srcMatch[2]).trim()
    if (!url.startsWith(POST_IMAGE_URL_PREFIX)) {
      continue
    }
    if (seen.has(url)) {
      continue
    }
    seen.add(url)
    const altMatch = /\balt\s*=\s*(["'])([^"']*)\1/i.exec(tag)
    const alt = altMatch ? altMatch[2] : null
    out.push({ url, alt })
  }
  return out
}

/**
 * @param {import('mysql2/promise').Pool | import('mysql2/promise').PoolConnection} conn
 * @param {number} postId
 * @param {string} html
 */
async function syncPostImagesFromHtml(conn, postId, html) {
  const rows = extractPostImageRows(html)
  await conn.query('DELETE FROM post_images WHERE post_id = ?', [postId])
  for (const { url, alt } of rows) {
    await conn.query('INSERT INTO post_images (post_id, url, alt_text) VALUES (?, ?, ?)', [postId, url, alt])
  }
}

module.exports = { syncPostImagesFromHtml, extractPostImageRows, POST_IMAGE_URL_PREFIX }
