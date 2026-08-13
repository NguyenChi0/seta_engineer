/** Slug không được dùng cho landing page — trùng route hệ thống. */
export const RESERVED_LANDING_SLUGS = new Set([
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
  'login'
])

export function isReservedLandingSlug(slug) {
  const s = String(slug || '').trim().toLowerCase()
  return !s || RESERVED_LANDING_SLUGS.has(s)
}

export function getLandingHref(slug) {
  const s = String(slug || '').trim()
  return s ? `/${s}` : '/'
}
