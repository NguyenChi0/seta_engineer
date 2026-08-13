export function escapeHtmlAttr(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
}

export function buildImageTag(url, { alt = '', title = '' } = {}) {
  const src = escapeHtmlAttr(url)
  const parts = [`src="${src}"`]
  if (alt) {
    parts.push(`alt="${escapeHtmlAttr(alt)}"`)
  }
  if (title) {
    parts.push(`title="${escapeHtmlAttr(title)}"`)
  }
  return `<img ${parts.join(' ')} />`
}

/** Cập nhật alt/title cho mọi thẻ img có cùng src trong HTML. */
export function updateImageSeoInHtml(html, url, { alt, title }) {
  const raw = String(html || '')
  const targetUrl = String(url || '').trim()
  if (!raw || !targetUrl) {
    return raw
  }

  return raw.replace(/<img\b[^>]*>/gi, (tag) => {
    const srcMatch = /\bsrc\s*=\s*(["'])([^"']+)\1/i.exec(tag)
    if (!srcMatch || srcMatch[2].trim() !== targetUrl) {
      return tag
    }

    let next = tag
    if (alt !== undefined) {
      const altVal = String(alt || '')
      if (/\balt\s*=/i.test(next)) {
        next = next.replace(/\balt\s*=\s*(["'])[^"']*\1/i, `alt="${escapeHtmlAttr(altVal)}"`)
      } else {
        next = next.replace(/<img\b/i, `<img alt="${escapeHtmlAttr(altVal)}"`)
      }
    }
    if (title !== undefined) {
      const titleVal = String(title || '')
      if (/\btitle\s*=/i.test(next)) {
        next = next.replace(/\btitle\s*=\s*(["'])[^"']*\1/i, `title="${escapeHtmlAttr(titleVal)}"`)
      } else {
        next = next.replace(/\/?>$/, (m) => ` title="${escapeHtmlAttr(titleVal)}"${m}`)
      }
    }
    return next
  })
}
