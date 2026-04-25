import { normalizeApiAssetPath, normalizeApiAssetPathsInHtml } from '../../utils/assetUrl'

export function buildPostPayload(formData) {
  const title = formData.title.trim()
  const excerpt = formData.excerpt.trim()
  const tags = (formData.category || formData.tags || '').trim()
  const titleImage = normalizeApiAssetPath(formData.titleImage || '')
  const contentHtml = normalizeApiAssetPathsInHtml(formData.contentHtml.trim())

  return {
    title,
    tags,
    excerpt,
    titleImage,
    content: contentHtml
  }
}

export function validatePostForm(formData) {
  const errors = {}
  const plainText = (formData.contentHtml || '').replace(/<[^>]*>/g, '').trim()

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
  if (!plainText) {
    errors.contentHtml = 'Vui long nhap noi dung bai viet.'
  }

  return errors
}
