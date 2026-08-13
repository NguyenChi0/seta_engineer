/** Đường dẫn public tới bài viết — ưu tiên slug, fallback id. */
export function getPostHref(post) {
  if (!post) {
    return '/news'
  }
  const slug = String(post.slug || '').trim()
  if (slug) {
    return `/news/${slug}`
  }
  if (post.id != null) {
    return `/news/${post.id}`
  }
  return '/news'
}
