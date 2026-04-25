const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

export function normalizeApiAssetPath(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''

  // Keep absolute non-upload URLs as-is.
  if (/^(data:|blob:)/i.test(raw)) return raw

  // If old data stores full URL, strip origin and keep endpoint only.
  try {
    if (/^https?:\/\//i.test(raw)) {
      const u = new URL(raw)
      return u.pathname + (u.search || '') + (u.hash || '')
    }
  } catch {
    return raw
  }

  return raw
}

export function resolveApiAssetUrl(value) {
  const raw = normalizeApiAssetPath(value)
  if (!raw) return ''

  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) {
    return raw
  }

  if (!API_BASE_URL) return raw

  // Backward compatibility: some old DB rows keep only filename.
  if (!raw.startsWith('/') && !raw.includes('/') && /\.[a-z0-9]{2,5}$/i.test(raw)) {
    return `${API_BASE_URL}/api/uploads/post-title-images/${raw}`
  }

  if (raw.startsWith('/')) {
    return `${API_BASE_URL}${raw}`
  }

  return `${API_BASE_URL}/${raw}`
}

export function resolveApiAssetUrlsInHtml(html) {
  const raw = String(html || '')
  if (!raw || !API_BASE_URL) return raw

  return raw.replace(/(src|href)=(["'])\/api\/uploads\//g, `$1=$2${API_BASE_URL}/api/uploads/`)
}

export function normalizeApiAssetPathsInHtml(html) {
  const raw = String(html || '')
  if (!raw) return raw

  return raw.replace(/(src|href)=(["'])(https?:\/\/[^"']+\/api\/uploads\/[^"']+)(["'])/gi, (_m, attr, q1, url, q2) => {
    const endpoint = normalizeApiAssetPath(url)
    return `${attr}=${q1}${endpoint}${q2}`
  })
}
