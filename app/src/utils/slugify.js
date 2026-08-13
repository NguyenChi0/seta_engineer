/** Tạo slug URL-friendly từ tiêu đề (fallback post-{id} nếu rỗng). */
export function slugify(text) {
  const base = String(text || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base
}

export function slugifyOrFallback(text, fallbackId) {
  return slugify(text) || (fallbackId != null ? `post-${fallbackId}` : 'post')
}
