const fs = require('fs')
const path = require('path')
const express = require('express')
const { FRONTEND_DIST, FRONTEND_PUBLIC, SITE_URL } = require('./siteConfig')
const { generateSitemapXml } = require('./sitemap')
const { resolveRoute } = require('./resolveRoute')
const { injectPrerenderHtml } = require('./htmlUtils')

let cachedIndexTemplate = null
let cachedIndexMtime = 0

function getIndexTemplate() {
  const indexPath = path.join(FRONTEND_DIST, 'index.html')
  if (!fs.existsSync(indexPath)) {
    return null
  }
  const stat = fs.statSync(indexPath)
  if (!cachedIndexTemplate || stat.mtimeMs !== cachedIndexMtime) {
    cachedIndexTemplate = fs.readFileSync(indexPath, 'utf8')
    cachedIndexMtime = stat.mtimeMs
  }
  return cachedIndexTemplate
}

function getRobotsTxt() {
  const distPath = path.join(FRONTEND_DIST, 'robots.txt')
  if (fs.existsSync(distPath)) {
    return fs.readFileSync(distPath, 'utf8')
  }
  const publicPath = path.join(FRONTEND_PUBLIC, 'robots.txt')
  if (fs.existsSync(publicPath)) {
    return fs.readFileSync(publicPath, 'utf8')
  }
  return [
    'User-agent: *',
    'Allow: /',
    '',
    'Disallow: /admin',
    'Disallow: /admin/',
    'Disallow: /api/',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`
  ].join('\n')
}

function wantsHtmlResponse(req) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return false
  }
  const accept = String(req.headers.accept || '')
  if (accept.includes('text/html')) {
    return true
  }
  const ext = path.extname(req.path)
  if (ext && ext !== '.html') {
    return false
  }
  return !accept || accept === '*/*' || accept.includes('*/*')
}

function setupSeoRoutes(app, db) {
  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').status(200).send(getRobotsTxt())
  })

  app.get('/sitemap.xml', async (_req, res) => {
    try {
      const xml = await generateSitemapXml(db)
      res.type('application/xml').status(200).send(xml)
    } catch (e) {
      console.error('[sitemap]', e)
      res.status(500).type('text/plain').send('Sitemap generation failed')
    }
  })
}

function setupFrontendServing(app, db) {
  if (!fs.existsSync(FRONTEND_DIST)) {
    console.warn('[seo] app/dist not found — run `pnpm build` in app/ before SERVE_FRONTEND=1')
    return
  }

  app.use(
    express.static(FRONTEND_DIST, {
      index: false,
      fallthrough: true
    })
  )

  app.get('*', async (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next()
    }
    if (!wantsHtmlResponse(req)) {
      return next()
    }

    const template = getIndexTemplate()
    if (!template) {
      return res.status(503).type('text/plain').send('Frontend build not found')
    }

    try {
      const page = await resolveRoute(db, req.path)

      if (page.redirect) {
        const target = page.redirect.startsWith('http')
          ? page.redirect
          : page.redirect
        return res.redirect(page.status || 301, target)
      }

      const html = injectPrerenderHtml(template, page)

      if (req.method === 'HEAD') {
        return res.status(page.status).type('text/html').end()
      }

      return res.status(page.status).type('text/html').send(html)
    } catch (e) {
      console.error('[prerender]', req.path, e)
      return next(e)
    }
  })
}

module.exports = {
  setupSeoRoutes,
  setupFrontendServing,
  getRobotsTxt,
  getIndexTemplate
}
