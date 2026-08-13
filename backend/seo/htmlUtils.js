const { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } = require('./siteConfig')

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function stripHtmlTags(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractFirstMatch(html, pattern) {
  const match = String(html || '').match(pattern)
  return match ? stripHtmlTags(match[1]) : ''
}

function extractH1(html) {
  return extractFirstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)
}

function extractFirstParagraph(html) {
  return extractFirstMatch(html, /<p[^>]*>([\s\S]*?)<\/p>/i)
}

function stripScripts(html) {
  return String(html || '').replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
}

function extractLandingBodyHtml(raw) {
  const text = stripScripts(String(raw || ''))
  const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch) {
    return bodyMatch[1].trim()
  }
  return text.trim()
}

function toAbsoluteUrl(url) {
  const raw = String(url || '').trim()
  if (!raw) {
    return ''
  }
  if (/^https?:\/\//i.test(raw)) {
    return raw
  }
  return `${SITE_URL}${raw.startsWith('/') ? raw : `/${raw}`}`
}

function formatPageTitle(title, useFullTitle = false) {
  const t = String(title || '').trim()
  if (!t) {
    return SITE_NAME
  }
  if (useFullTitle || t.includes('｜') || t.includes('|')) {
    return t
  }
  return `${t}｜${SITE_NAME}`
}

function formatLastmod(dateValue) {
  if (!dateValue) {
    return null
  }
  const d = dateValue instanceof Date ? dateValue : new Date(dateValue)
  if (Number.isNaN(d.getTime())) {
    return null
  }
  return d.toISOString().slice(0, 10)
}

function buildMetaTags({
  title,
  description,
  canonicalPath,
  ogImage,
  ogType = 'website',
  robots = null,
  jsonLd = null
}) {
  const docTitle = formatPageTitle(title)
  const desc = String(description || '').trim()
  const canonical = toAbsoluteUrl(canonicalPath || '/')
  const image = toAbsoluteUrl(ogImage || DEFAULT_OG_IMAGE)
  const ogTitle = String(title || '').trim() || SITE_NAME

  const tags = [
    `<meta name="description" content="${escapeHtml(desc)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:type" content="${escapeHtml(ogType)}" />`,
    `<meta property="og:title" content="${escapeHtml(ogTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(desc)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />`,
    `<meta property="og:locale" content="ja_JP" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta property="og:image:secure_url" content="${escapeHtml(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(ogTitle)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(desc)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`
  ]

  if (robots) {
    tags.push(`<meta name="robots" content="${escapeHtml(robots)}" />`)
  }

  if (jsonLd) {
    tags.push(
      `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`
    )
  }

  return {
    docTitle,
    metaBlock: tags.join('\n    ')
  }
}

function injectPrerenderHtml(template, { docTitle, metaBlock, bodyHtml }) {
  let html = String(template || '')

  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(docTitle)}</title>`)

  html = html.replace(/<meta\s+name="description"[^>]*>/i, '')
  html = html.replace(/<meta\s+property="og:[^"]+"[^>]*>/gi, '')
  html = html.replace(/<meta\s+name="twitter:[^"]+"[^>]*>/gi, '')
  html = html.replace(/<link\s+rel="canonical"[^>]*>/i, '')
  html = html.replace(/<script\s+type="application\/ld\+json"[\s\S]*?<\/script>/gi, '')

  html = html.replace(
    /<meta\s+charset="UTF-8"\s*\/?>/i,
    (m) => `${m}\n    ${metaBlock}`
  )

  const prerenderBody = `<div id="seo-prerender" data-ssr="1">${bodyHtml || ''}</div>`
  html = html.replace(/<div id="root"><\/div>/i, `<div id="root">${prerenderBody}</div>`)

  return html
}

module.exports = {
  escapeHtml,
  stripHtmlTags,
  extractH1,
  extractFirstParagraph,
  stripScripts,
  extractLandingBodyHtml,
  toAbsoluteUrl,
  formatPageTitle,
  formatLastmod,
  buildMetaTags,
  injectPrerenderHtml
}
