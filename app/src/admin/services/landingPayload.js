import { slugify } from '../../utils/slugify'
import { normalizeApiAssetPathsInHtml } from '../../utils/assetUrl'
import { isReservedLandingSlug } from '../../utils/reservedSlugs'

export function buildLandingPayload(formData) {
  return {
    title: formData.title.trim(),
    slug: slugify(formData.slug?.trim() || formData.title),
    content: normalizeApiAssetPathsInHtml(formData.contentHtml.trim()),
    metaTitle: (formData.metaTitle || '').trim() || undefined,
    metaDescription: (formData.metaDescription || '').trim() || undefined,
    status: formData.published ? 1 : 0
  }
}

export function validateLandingForm(formData) {
  const errors = {}

  if (!formData.title.trim()) {
    errors.title = 'Vui long nhap ten trang.'
  }
  const slug = slugify(formData.slug?.trim() || formData.title)
  if (!slug) {
    errors.slug = 'Slug khong hop le.'
  } else if (isReservedLandingSlug(slug)) {
    errors.slug = 'Slug trung voi duong dan he thong (news, contact, ...).'
  }
  if (!(formData.contentHtml || '').trim()) {
    errors.contentHtml = 'Vui long nhap noi dung HTML.'
  }

  return errors
}
