import { useEffect } from 'react'

const SITE_NAME = 'Seta Engineering'
const DEFAULT_DESCRIPTION = '株式会社Seta Engineering 公式サイト'

function getSiteOrigin() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '')
  }
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  return base ? base : ''
}

function upsertMeta(attr, key, content) {
  if (!content) {
    return null
  }
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
  return el
}

function upsertLink(rel, href) {
  if (!href) {
    return null
  }
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
  return el
}

function toAbsoluteUrl(url) {
  const raw = String(url || '').trim()
  if (!raw) {
    return ''
  }
  if (/^https?:\/\//i.test(raw)) {
    return raw
  }
  const origin = getSiteOrigin()
  if (!origin) {
    return raw
  }
  return `${origin}${raw.startsWith('/') ? raw : `/${raw}`}`
}

/**
 * Cập nhật title, description, Open Graph và Twitter Card.
 * OG image mặc định lấy từ ảnh tiêu đề bài viết (titleImage).
 */
export function usePageMeta({ title, description, image, url, type = 'website' } = {}) {
  useEffect(() => {
    const prevTitle = document.title
    const managed = []

    const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
    document.title = pageTitle

    const desc = description || DEFAULT_DESCRIPTION
    const absUrl = toAbsoluteUrl(url || (typeof window !== 'undefined' ? window.location.pathname : ''))
    const absImage = toAbsoluteUrl(image || '/assets/pre_logo.jpg')

    const entries = [
      upsertMeta('name', 'description', desc),
      upsertMeta('property', 'og:type', type),
      upsertMeta('property', 'og:title', title || SITE_NAME),
      upsertMeta('property', 'og:description', desc),
      upsertMeta('property', 'og:site_name', SITE_NAME),
      upsertMeta('property', 'og:locale', 'ja_JP'),
      upsertMeta('property', 'og:url', absUrl),
      upsertMeta('property', 'og:image', absImage),
      upsertMeta('property', 'og:image:secure_url', absImage),
      upsertMeta('name', 'twitter:card', 'summary_large_image'),
      upsertMeta('name', 'twitter:title', title || SITE_NAME),
      upsertMeta('name', 'twitter:description', desc),
      upsertMeta('name', 'twitter:image', absImage),
      upsertLink('canonical', absUrl)
    ]
    managed.push(...entries.filter(Boolean))

    return () => {
      document.title = prevTitle
      managed.forEach((el) => el.remove())
    }
  }, [title, description, image, url, type])
}
