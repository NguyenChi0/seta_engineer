export function stripUnsafeHtml(html) {
  return String(html || '').replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
}

/** Đổi selector body/html sang scope trong Shadow DOM. */
function scopeLandingCss(css) {
  return String(css || '')
    .replace(/\bhtml\b/g, ':host')
    .replace(/\bbody\b/g, '.landing-shadow-root')
}

function isFullHtmlDocument(text) {
  return /<!DOCTYPE\s+html|<html[\s>]/i.test(text)
}

/**
 * Chuẩn bị HTML render trong Shadow DOM:
 * - Giữ <style> / <link> từ <head>
 * - Bọc nội dung body, tránh CSS global site ghi đè
 */
export function prepareLandingShadowContent(raw) {
  const text = stripUnsafeHtml(String(raw || ''))
  if (!text.trim()) return ''

  try {
    const doc = new DOMParser().parseFromString(text, 'text/html')
    const headStyles = Array.from(doc.head?.querySelectorAll('style, link[rel="stylesheet"]') || [])
    const bodyRootStyles = Array.from(doc.body?.querySelectorAll(':scope > style') || [])

    const styleBlocks = [...headStyles, ...bodyRootStyles]
      .map((el) => {
        if (el.tagName === 'STYLE') {
          return `<style>${scopeLandingCss(el.textContent || '')}</style>`
        }
        return el.outerHTML
      })
      .join('\n')

    let bodyHtml = doc.body?.innerHTML || text
    bodyRootStyles.forEach((el) => {
      bodyHtml = bodyHtml.replace(el.outerHTML, '')
    })

    const hostStyle = '<style>:host { display: block; min-height: 100vh; }</style>'

    if (isFullHtmlDocument(text) || styleBlocks) {
      return `${hostStyle}${styleBlocks}<div class="landing-shadow-root">${bodyHtml.trim()}</div>`
    }

    return text
  } catch {
    return text
  }
}

/** @deprecated Dùng prepareLandingShadowContent — giữ cho tương thích. */
export function extractLandingHtml(raw) {
  return prepareLandingShadowContent(raw)
}
