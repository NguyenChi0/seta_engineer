/** Map nhãn admin (VI/EN) → hiển thị công khai (JA). */
const CATEGORY_LABEL_JA = {
  'Thông báo': 'お知らせ',
  'Tin tức': 'ニュース',
  'Sự kiện': 'イベント',
  Campaign: 'キャンペーン',
  Blog: 'ブログ',
  お知らせ: 'お知らせ',
  ニュース: 'ニュース',
  イベント: 'イベント',
  キャンペーン: 'キャンペーン',
  ブログ: 'ブログ'
}

/** Chuẩn hóa danh mục khi load form admin (dữ liệu cũ tiếng Việt → tiếng Nhật). */
const ADMIN_CATEGORY_NORMALIZE = {
  'Thông báo': 'お知らせ',
  'Tin tức': 'ニュース',
  'Sự kiện': 'イベント',
  Campaign: 'キャンペーン',
  Blog: 'ブログ'
}

export const ADMIN_CATEGORY_OPTIONS = ['お知らせ', 'ニュース', 'イベント', 'キャンペーン', 'ブログ']
export const ADMIN_QUICK_CATEGORIES = ['お知らせ', 'ニュース', 'イベント', 'キャンペーン']

/** Lấy danh mục chính — phần đầu trước dấu phẩy (category + extra tags gộp trong DB). */
export function getPrimaryCategory(tags) {
  const raw = String(tags || '').trim()
  if (!raw) {
    return 'お知らせ'
  }
  return raw.split(',')[0].trim() || 'お知らせ'
}

/** Nhãn hiển thị trên site công khai (luôn tiếng Nhật). */
export function getDisplayCategory(category) {
  const raw = String(category || '').trim()
  if (!raw) {
    return 'お知らせ'
  }
  return CATEGORY_LABEL_JA[raw] || raw
}

export function normalizeAdminCategory(category) {
  const raw = String(category || '').trim()
  if (!raw) {
    return ''
  }
  return ADMIN_CATEGORY_NORMALIZE[raw] || raw
}

/** Map danh mục → class màu trên card (category--info, …). */
export function getCategoryKey(category) {
  const display = getDisplayCategory(category)
  const c = `${String(category || '')} ${display}`.trim().toLowerCase()

  if (
    c.includes('recruit') ||
    c.includes('採用') ||
    c.includes('tuyển') ||
    c.includes('tuyen') ||
    c.includes('nhân sự')
  ) {
    return 'recruit'
  }
  if (c.includes('achievement') || c.includes('実績') || c.includes('事例')) {
    return 'achievements'
  }
  if (
    c.includes('topic') ||
    c.includes('blog') ||
    c.includes('ブログ') ||
    c.includes('campaign') ||
    c.includes('キャンペーン') ||
    c.includes('sự kiện') ||
    c.includes('su kien') ||
    c.includes('イベント')
  ) {
    return 'topics'
  }

  return 'info'
}

export function parsePostCategory(tags) {
  const raw = getPrimaryCategory(tags)
  return {
    category: getDisplayCategory(raw),
    categoryKey: getCategoryKey(raw)
  }
}

/** Tách chuỗi tags DB → danh mục chính + tags phụ (dùng khi load form admin). */
export function parsePostTagsForEditor(tags) {
  const parts = String(tags || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (parts.length === 0) {
    return { category: '', extraTags: [] }
  }

  const [first, ...extraTags] = parts
  return {
    category: normalizeAdminCategory(first),
    extraTags
  }
}
