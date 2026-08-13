const { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } = require('./siteConfig')
const {
  getStaticPageByPath,
  readContentFile,
  isValidSubserviceId
} = require('./staticPages')
const {
  extractH1,
  extractFirstParagraph,
  extractLandingBodyHtml,
  toAbsoluteUrl,
  buildMetaTags,
  escapeHtml
} = require('./htmlUtils')

const RESERVED_LANDING_SLUGS = new Set([
  'admin',
  'api',
  'assets',
  'content',
  'mission',
  'recruitment',
  'achievements',
  'company',
  'setax-ws',
  'contact',
  'news',
  'privacy-policy',
  'login',
  'robots.txt',
  'sitemap.xml'
])

function normalizePath(rawPath) {
  const p = String(rawPath || '/').split('?')[0].split('#')[0]
  if (p.length > 1 && p.endsWith('/')) {
    return p.replace(/\/+$/, '')
  }
  return p || '/'
}

function isReservedLandingSlug(slug) {
  const s = String(slug || '').trim().toLowerCase()
  return !s || RESERVED_LANDING_SLUGS.has(s)
}

function sqlContentToUtf8(value) {
  if (value == null) {
    return ''
  }
  if (Buffer.isBuffer(value)) {
    return value.toString('utf8')
  }
  return String(value)
}

function buildPageResult({
  status = 200,
  path,
  title,
  description,
  bodyHtml,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  robots = null,
  jsonLd = null,
  lastmod = null
}) {
  const meta = buildMetaTags({
    title,
    description,
    canonicalPath: path,
    ogImage,
    ogType,
    robots,
    jsonLd
  })

  return {
    status,
    path,
    title,
    description,
    bodyHtml,
    lastmod,
    ...meta
  }
}

function resolveStaticPage(urlPath) {
  const page = getStaticPageByPath(urlPath)
  if (!page) {
    return null
  }

  let bodyHtml = page.bodyHtml || ''
  if (page.contentFile) {
    bodyHtml = readContentFile(page.contentFile)
  }

  const h1 = extractH1(bodyHtml)
  const fallbackDesc = extractFirstParagraph(bodyHtml)
  const title = page.title || h1
  const description = page.description || fallbackDesc

  return buildPageResult({
    status: 200,
    path: urlPath,
    title,
    description,
    bodyHtml
  })
}

async function resolveNewsDetail(db, newsKey) {
  const key = String(newsKey || '').trim()
  if (!key) {
    return buildPageResult({
      status: 404,
      path: `/news/${key}`,
      title: 'ページが見つかりません',
      description: 'お探しのページは見つかりませんでした。',
      bodyHtml: '<main><h1>お探しのページが見つかりません。</h1></main>'
    })
  }

  const isNumeric = /^\d+$/.test(key)
  const sql = isNumeric
    ? 'SELECT id, title, slug, content, excerpt, title_image, meta_title, meta_description, created_at FROM posts WHERE id = ? AND status = 1'
    : 'SELECT id, title, slug, content, excerpt, title_image, meta_title, meta_description, created_at FROM posts WHERE slug = ? AND status = 1'
  const [rows] = await db.query(sql, [isNumeric ? Number(key) : key])
  if (rows.length === 0) {
    return buildPageResult({
      status: 404,
      path: `/news/${key}`,
      title: 'ページが見つかりません',
      description: 'お探しのページは見つかりませんでした。',
      bodyHtml: '<main><h1>お探しのページが見つかりません。</h1></main>'
    })
  }

  const row = rows[0]
  const slug = row.slug || String(row.id)
  const canonicalPath = `/news/${slug}`

  if (isNumeric && row.slug && row.slug !== key) {
    return {
      status: 301,
      redirect: canonicalPath
    }
  }

  const title = row.meta_title?.trim() || row.title
  const description =
    row.meta_description?.trim() || row.excerpt?.trim() || extractFirstParagraph(sqlContentToUtf8(row.content))
  const bodyHtml = sqlContentToUtf8(row.content)
  const ogImage = row.title_image ? row.title_image : DEFAULT_OG_IMAGE
  const createdAt = row.created_at ? new Date(row.created_at).toISOString() : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: row.title,
    description,
    datePublished: createdAt,
    image: toAbsoluteUrl(ogImage),
    mainEntityOfPage: toAbsoluteUrl(canonicalPath),
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL
    }
  }

  return buildPageResult({
    status: 200,
    path: canonicalPath,
    title,
    description,
    bodyHtml: `<article class="news-article"><h1>${escapeHtml(row.title)}</h1>${bodyHtml}</article>`,
    ogImage,
    ogType: 'article',
    jsonLd,
    lastmod: row.created_at
  })
}

async function resolveLandingPage(db, slug) {
  const normalized = String(slug || '').trim().toLowerCase()
  if (isReservedLandingSlug(normalized)) {
    return buildPageResult({
      status: 404,
      path: `/${normalized}`,
      title: 'ページが見つかりません',
      description: 'お探しのページは見つかりませんでした。',
      bodyHtml: '<main><h1>お探しのページが見つかりません。</h1></main>'
    })
  }

  const [rows] = await db.query(
    'SELECT title, slug, content, meta_title, meta_description, updated_at FROM landing_pages WHERE slug = ? AND status = 1',
    [normalized]
  )
  if (rows.length === 0) {
    return buildPageResult({
      status: 404,
      path: `/${normalized}`,
      title: 'ページが見つかりません',
      description: 'お探しのページは見つかりませんでした。',
      bodyHtml: '<main><h1>お探しのページが見つかりません。</h1></main>'
    })
  }

  const row = rows[0]
  const title = row.meta_title?.trim() || row.title
  const bodyRaw = sqlContentToUtf8(row.content)
  const description = row.meta_description?.trim() || extractFirstParagraph(extractLandingBodyHtml(bodyRaw))
  const bodyHtml = extractLandingBodyHtml(bodyRaw)

  return buildPageResult({
    status: 200,
    path: `/${normalized}`,
    title,
    description,
    bodyHtml,
    lastmod: row.updated_at
  })
}

async function resolveRoute(db, rawPath) {
  const urlPath = normalizePath(rawPath)

  if (urlPath.startsWith('/admin')) {
    return buildPageResult({
      status: 200,
      path: urlPath,
      title: 'Admin',
      description: '',
      bodyHtml: '',
      robots: 'noindex, nofollow'
    })
  }

  const staticPage = resolveStaticPage(urlPath)
  if (staticPage) {
    return staticPage
  }

  const newsMatch = urlPath.match(/^\/news\/([^/]+)$/)
  if (newsMatch) {
    return resolveNewsDetail(db, newsMatch[1])
  }

  const outsourcingMatch = urlPath.match(/^\/recruitment\/outsourcing\/([^/]+)$/)
  if (outsourcingMatch) {
    const id = outsourcingMatch[1]
    if (!isValidSubserviceId(id)) {
      return buildPageResult({
        status: 404,
        path: urlPath,
        title: 'ページが見つかりません',
        description: 'お探しのページは見つかりませんでした。',
        bodyHtml: '<main><h1>お探しのページが見つかりません。</h1></main>'
      })
    }
    return resolveStaticPage(`/recruitment/outsourcing/${id}`)
  }

  const recruitmentMatch = urlPath.match(/^\/recruitment\/([^/]+)$/)
  if (recruitmentMatch && recruitmentMatch[1] !== 'outsourcing') {
    const id = recruitmentMatch[1]
    if (!isValidSubserviceId(id)) {
      return buildPageResult({
        status: 404,
        path: urlPath,
        title: 'ページが見つかりません',
        description: 'お探しのページは見つかりませんでした。',
        bodyHtml: '<main><h1>お探しのページが見つかりません。</h1></main>'
      })
    }
    return resolveStaticPage(`/recruitment/${id}`)
  }

  const rootSlugMatch = urlPath.match(/^\/([^/]+)$/)
  if (rootSlugMatch) {
    return resolveLandingPage(db, rootSlugMatch[1])
  }

  if (urlPath !== '/') {
    return buildPageResult({
      status: 404,
      path: urlPath,
      title: 'ページが見つかりません',
      description: 'お探しのページは見つかりませんでした。',
      bodyHtml: '<main><h1>お探しのページが見つかりません。</h1></main>'
    })
  }

  return resolveStaticPage('/')
}

module.exports = {
  normalizePath,
  isReservedLandingSlug,
  resolveRoute
}
