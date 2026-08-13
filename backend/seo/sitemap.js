const { SITE_URL } = require('./siteConfig')
const { getAllStaticSitemapPaths } = require('./staticPages')
const { formatLastmod } = require('./htmlUtils')

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildUrlEntry(loc, lastmod) {
  const lastmodTag = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : ''
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmodTag}\n  </url>`
}

function buildLoc(urlPath) {
  if (urlPath === '/') {
    return `${SITE_URL}/`
  }
  return `${SITE_URL}${urlPath}`
}

async function generateSitemapXml(db) {
  const entries = []

  for (const p of getAllStaticSitemapPaths()) {
    entries.push(buildUrlEntry(buildLoc(p)))
  }

  const [posts] = await db.query(
    'SELECT slug, id, created_at FROM posts WHERE status = 1 ORDER BY id DESC'
  )
  for (const row of posts) {
    const slug = row.slug || String(row.id)
    const lastmod = formatLastmod(row.created_at)
    entries.push(buildUrlEntry(`${SITE_URL}/news/${slug}`, lastmod))
  }

  const [landings] = await db.query(
    'SELECT slug, updated_at FROM landing_pages WHERE status = 1 ORDER BY id DESC'
  )
  for (const row of landings) {
    const lastmod = formatLastmod(row.updated_at)
    entries.push(buildUrlEntry(`${SITE_URL}/${row.slug}`, lastmod))
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries.join('\n'),
    '</urlset>'
  ].join('\n')
}

module.exports = {
  generateSitemapXml
}
