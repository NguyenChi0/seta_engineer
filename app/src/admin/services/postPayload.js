import { normalizeApiAssetPath, normalizeApiAssetPathsInHtml } from '../../utils/assetUrl'
import { slugify } from '../../utils/slugify'

/** Text thực sau khi bỏ tag — dùng cho validate, không dùng cho hiển thị. */
export function getContentPlainText(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;|&#xA0;/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Có nội dung hợp lệ: chữ, ảnh, video, iframe… */
export function hasPostContent(html) {
  const raw = String(html || '').trim()
  if (!raw) {
    return false
  }
  if (getContentPlainText(raw)) {
    return true
  }
  return /<(img|video|iframe|embed|object|audio|picture)\b/i.test(raw)
}

export function buildPostPayload(formData) {
  const title = formData.title.trim()
  const excerpt = formData.excerpt.trim()
  const tags = (formData.category || formData.tags || '').trim()
  const titleImage = normalizeApiAssetPath(formData.titleImage || '')
  const contentHtml = normalizeApiAssetPathsInHtml(formData.contentHtml.trim())
  const slug = slugify(formData.slug?.trim() || title)
  const metaTitle = (formData.metaTitle || '').trim()
  const metaDescription = (formData.metaDescription || '').trim()

  return {
    title,
    tags,
    excerpt,
    titleImage,
    content: contentHtml,
    slug: slug || undefined,
    metaTitle: metaTitle || undefined,
    metaDescription: metaDescription || undefined
  }
}

export function validatePostForm(formData) {
  const errors = {}

  if (!formData.title.trim()) {
    errors.title = 'Vui long nhap tieu de bai viet.'
  }
  if (!(formData.category || formData.tags || '').trim()) {
    errors.category = 'Vui long nhap danh muc.'
  }
  if (!formData.excerpt.trim()) {
    errors.excerpt = 'Vui long nhap mo ta ngan.'
  }
  if (!(formData.titleImage || '').trim()) {
    errors.titleImage = 'Vui long tai anh tieu de.'
  }
  if (!hasPostContent(formData.contentHtml)) {
    errors.contentHtml = 'Vui long nhap noi dung bai viet.'
  }

  return errors
}
