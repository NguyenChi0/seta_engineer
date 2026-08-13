import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ReactQuill from 'react-quill'
import QuillResizeImage from 'quill-resize-image'
import 'react-quill/dist/quill.snow.css'
import './postEditor.css'

const Quill = ReactQuill.Quill
const BaseModule = Quill.import('core/module')
class ResizeImageModule extends BaseModule {
  constructor(quill, options) {
    super(quill, options ?? {})
    QuillResizeImage(quill, options ?? {})
  }
}
Quill.register('modules/resize', ResizeImageModule, true)

import {
  getAdminPost,
  patchAdminPost,
  postAdminPost,
  uploadAdminPostImage,
  uploadAdminTitleImage
} from '../../api'
import { buildPostPayload, validatePostForm } from '../services/postPayload'
import { normalizeApiAssetPath, resolveApiAssetUrl } from '../../utils/assetUrl'
import { slugify } from '../../utils/slugify'
import { getPostHref } from '../../utils/postUrl'
import { parsePostTagsForEditor, ADMIN_CATEGORY_OPTIONS, ADMIN_QUICK_CATEGORIES } from '../../utils/postCategory'
import { buildImageTag, updateImageSeoInHtml } from '../../utils/imageHtml'
import MediaLibraryModal from '../components/MediaLibraryModal'

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'
const QUICK_CATEGORIES = ADMIN_QUICK_CATEGORIES
const CATEGORY_OPTIONS = ADMIN_CATEGORY_OPTIONS

function normalizeAdminPostHtml(raw) {
  if (raw == null) return ''
  if (typeof raw === 'string') return raw
  if (typeof raw === 'object' && raw.type === 'Buffer' && Array.isArray(raw.data)) {
    try {
      return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(raw.data))
    } catch {
      return ''
    }
  }
  return String(raw)
}

function stripUnsafeHtml(html) {
  return String(html || '').replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
}

function insertAtCursor(textarea, text) {
  if (!textarea) return
  const start = textarea.selectionStart ?? textarea.value.length
  const end = textarea.selectionEnd ?? start
  const before = textarea.value.slice(0, start)
  const after = textarea.value.slice(end)
  const next = `${before}${text}${after}`
  textarea.value = next
  const pos = start + text.length
  textarea.selectionStart = pos
  textarea.selectionEnd = pos
  textarea.focus()
  return next
}

/**
 * @param {{ mode: 'create' | 'edit' }} props
 */
function PostEditor({ mode }) {
  const { id: idParam } = useParams()
  const navigate = useNavigate()
  const quillRef = useRef(null)
  const htmlTextareaRef = useRef(null)
  const isEdit = mode === 'edit'
  const postId = idParam ? Number(idParam) : null

  const [contentMode, setContentMode] = useState('richtext')
  const [seoOpen, setSeoOpen] = useState(true)
  const [tagInput, setTagInput] = useState('')
  const [extraTags, setExtraTags] = useState([])

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    excerpt: '',
    titleImage: '',
    contentHtml: '',
    slug: '',
    metaTitle: '',
    metaDescription: ''
  })
  const [slugTouched, setSlugTouched] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitMessage, setSubmitMessage] = useState('')
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingPost, setLoadingPost] = useState(isEdit)
  const [titleFileBusy, setTitleFileBusy] = useState(false)
  const [contentImageBusy, setContentImageBusy] = useState(false)
  const [quillMountEpoch, setQuillMountEpoch] = useState(0)
  const [mediaOpen, setMediaOpen] = useState(false)
  const [mediaKind, setMediaKind] = useState('content')

  useEffect(() => {
    if (!isEdit) {
      setLoadingPost(false)
      setLoadError('')
      return
    }
    if (!postId || !Number.isInteger(postId) || postId < 1) {
      setLoadingPost(false)
      setLoadError('ID bài viết không hợp lệ')
      return
    }
    let cancelled = false
    ;(async () => {
      setLoadingPost(true)
      setLoadError('')
      setSubmitMessage('')
      try {
        const { post } = await getAdminPost(postId)
        if (cancelled || !post) return
        const contentHtml = normalizeAdminPostHtml(post.content)
        const { category, extraTags: loadedTags } = parsePostTagsForEditor(post.tags)
        setFormData({
          title: post.title || '',
          category,
          excerpt: post.excerpt || '',
          titleImage: post.titleImage || '',
          contentHtml,
          slug: post.slug || '',
          metaTitle: post.metaTitle || '',
          metaDescription: post.metaDescription || ''
        })
        setExtraTags(loadedTags)
        setTagInput('')
        setSlugTouched(Boolean(post.slug))
        setQuillMountEpoch((n) => n + 1)
      } catch (e) {
        if (!cancelled) setLoadError(e?.message || 'Không tải được bài viết')
      } finally {
        if (!cancelled) setLoadingPost(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isEdit, postId])

  useLayoutEffect(() => {
    if (contentMode !== 'richtext' || !isEdit || loadingPost) return
    const html = (formData.contentHtml || '').trim()
    if (!html) return
    const quill = quillRef.current?.getEditor?.()
    if (!quill) return
    const textLen = quill.getText().replace(/\u00a0/g, ' ').replace(/\s+/g, '').length
    const htmlTextLen = html.replace(/<[^>]*>/g, '').replace(/\s+/g, '').length
    if (htmlTextLen > 0 && textLen === 0) {
      quill.clipboard.dangerouslyPasteHTML(html)
    }
  }, [contentMode, isEdit, loadingPost, postId, quillMountEpoch, formData.contentHtml])

  const imageHandler = useCallback(() => {
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', IMAGE_ACCEPT)
    input.click()
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const { url } = await uploadAdminPostImage(file)
        const quill = quillRef.current?.getEditor?.()
        if (!quill) return
        const range = quill.getSelection(true)
        const index = range ? range.index : quill.getLength()
        quill.insertEmbed(index, 'image', url, 'user')
        quill.setSelection(index + 1, 0)
      } catch (e) {
        window.alert(e?.message || 'Tải ảnh thất bại')
      }
    }
  }, [])

  const quillModules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ font: [] }, { size: [] }],
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote', 'link', 'image', 'video'],
          ['clean']
        ],
        handlers: { image: imageHandler }
      },
      resize: {
        locale: {
          altTip: 'Giữ Alt để khóa tỷ lệ',
          inputTip: 'Nhấn Enter để áp dụng kích thước'
        }
      }
    }),
    [imageHandler]
  )

  const quillFormats = useMemo(
    () => [
      'font',
      'size',
      'header',
      'bold',
      'italic',
      'underline',
      'strike',
      'color',
      'background',
      'align',
      'list',
      'blockquote',
      'link',
      'image',
      'video'
    ],
    []
  )

  const categoryOptions = useMemo(() => {
    const opts = [...CATEGORY_OPTIONS]
    if (formData.category && !opts.includes(formData.category)) {
      return [formData.category, ...opts]
    }
    return opts
  }, [formData.category])

  const handleInputChange = (event) => {
    const { name, value } = event.target
    if (name === 'slug') setSlugTouched(true)
    setFormData((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'title' && !slugTouched) next.slug = slugify(value)
      if (name === 'metaDescription' && !prev.excerpt.trim()) next.excerpt = value.slice(0, 500)
      return next
    })
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleEditorChange = (value) => {
    setFormData((prev) => ({ ...prev, contentHtml: value }))
    setErrors((prev) => ({ ...prev, contentHtml: '' }))
  }

  const handleHtmlChange = (event) => {
    const value = stripUnsafeHtml(event.target.value)
    setFormData((prev) => ({ ...prev, contentHtml: value }))
    setErrors((prev) => ({ ...prev, contentHtml: '' }))
  }

  const switchContentMode = (nextMode) => {
    if (nextMode === contentMode) return
    if (nextMode === 'richtext' && contentMode === 'html') {
      const ok = window.confirm(
        'Chuyển sang RichText có thể làm Quill "dọn" lại HTML (bỏ style/class tùy chỉnh). Tiếp tục?'
      )
      if (!ok) return
      setQuillMountEpoch((n) => n + 1)
    }
    setContentMode(nextMode)
  }

  const handleContentImageUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setContentImageBusy(true)
    try {
      const { url } = await uploadAdminPostImage(file)
      const imgTag = `<img src="${url}" alt="" />`
      if (contentMode === 'html') {
        const next = insertAtCursor(htmlTextareaRef.current, imgTag)
        if (next != null) {
          setFormData((prev) => ({ ...prev, contentHtml: next }))
        }
      } else {
        const quill = quillRef.current?.getEditor?.()
        if (quill) {
          const range = quill.getSelection(true)
          const index = range ? range.index : quill.getLength()
          quill.insertEmbed(index, 'image', url, 'user')
          quill.setSelection(index + 1, 0)
        }
      }
    } catch (e) {
      window.alert(e?.message || 'Tải ảnh thất bại')
    } finally {
      setContentImageBusy(false)
    }
  }

  const handleTitleFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setTitleFileBusy(true)
    setErrors((prev) => ({ ...prev, titleImage: '' }))
    try {
      const { url } = await uploadAdminTitleImage(file)
      setFormData((prev) => ({ ...prev, titleImage: url }))
    } catch (e) {
      setErrors((prev) => ({ ...prev, titleImage: e?.message || 'Tải ảnh thất bại' }))
    } finally {
      setTitleFileBusy(false)
    }
  }

  const applyTitleImageUrl = () => {
    const raw = formData.titleImage.trim()
    if (!raw) return
    setFormData((prev) => ({ ...prev, titleImage: normalizeApiAssetPath(raw) }))
    setErrors((prev) => ({ ...prev, titleImage: '' }))
  }

  const selectCategory = (cat) => {
    setFormData((prev) => ({ ...prev, category: cat }))
    setErrors((prev) => ({ ...prev, category: '' }))
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (!t || extraTags.includes(t)) return
    setExtraTags((prev) => [...prev, t])
    setTagInput('')
  }

  const removeTag = (tag) => {
    setExtraTags((prev) => prev.filter((x) => x !== tag))
  }

  const openMediaLibrary = (kind) => {
    setMediaKind(kind)
    setMediaOpen(true)
  }

  const insertContentImage = (item) => {
    const imgTag = buildImageTag(item.url, { alt: item.altText, title: item.titleAttr })
    if (contentMode === 'html') {
      const next = insertAtCursor(htmlTextareaRef.current, imgTag)
      setFormData((prev) => ({
        ...prev,
        contentHtml: next != null ? next : `${prev.contentHtml}${imgTag}`
      }))
    } else {
      const quill = quillRef.current?.getEditor?.()
      if (quill) {
        const range = quill.getSelection(true)
        const index = range ? range.index : quill.getLength()
        quill.clipboard.dangerouslyPasteHTML(index, imgTag)
      }
    }
    setErrors((prev) => ({ ...prev, contentHtml: '' }))
  }

  const handleMediaSelect = (item) => {
    if (mediaKind === 'title') {
      setFormData((prev) => ({ ...prev, titleImage: item.url }))
      setErrors((prev) => ({ ...prev, titleImage: '' }))
      return
    }
    insertContentImage(item)
  }

  const handleApplyMediaSeoToContent = (item) => {
    setFormData((prev) => ({
      ...prev,
      contentHtml: updateImageSeoInHtml(prev.contentHtml, item.url, {
        alt: item.altText,
        title: item.titleAttr
      })
    }))
    if (contentMode === 'richtext') {
      setQuillMountEpoch((n) => n + 1)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    let contentHtml = formData.contentHtml
    if (contentMode === 'html' && htmlTextareaRef.current) {
      contentHtml = htmlTextareaRef.current.value
    } else if (contentMode === 'richtext') {
      const quill = quillRef.current?.getEditor?.()
      if (quill) {
        contentHtml = quill.root.innerHTML
      }
    }

    const payloadData = {
      ...formData,
      contentHtml: stripUnsafeHtml(contentHtml),
      category: [formData.category, ...extraTags].filter(Boolean).join(', ') || formData.category
    }
    const nextErrors = validatePostForm(payloadData)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setSubmitMessage('Form chưa hợp lệ, vui lòng kiểm tra lại.')
      return
    }
    const payload = buildPostPayload(payloadData)
    setSaving(true)
    setSubmitMessage('')
    try {
      if (isEdit && postId) {
        await patchAdminPost(postId, payload)
        setSubmitMessage('Đã cập nhật bài viết.')
      } else {
        await postAdminPost(payload)
        setSubmitMessage('Đã tạo bài viết.')
        navigate('/admin/posts')
      }
    } catch (e2) {
      setSubmitMessage(e2?.message || 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  if (isEdit && loadingPost) {
    return (
      <section className="admin-post-editor">
        <p style={{ color: '#6b7280' }}>Đang tải bài viết…</p>
      </section>
    )
  }

  if (isEdit && loadError) {
    return (
      <section className="admin-post-editor">
        <p className="admin-post-editor__message admin-post-editor__message--err" role="alert">
          {loadError}
        </p>
        <Link to="/admin/posts" className="admin-post-editor__back">
          Quay lại danh sách
        </Link>
      </section>
    )
  }

  const titleImagePreview = formData.titleImage ? resolveApiAssetUrl(formData.titleImage) : ''

  return (
    <section className="admin-post-editor">
      <div className="admin-post-editor__breadcrumb">
        Quản lý bài viết › {isEdit ? 'Sửa bài viết' : 'Tạo bài viết mới'}
      </div>

      <div className="admin-post-editor__header">
        <h2 className="admin-post-editor__title">{isEdit ? 'Sửa bài viết' : 'Tạo bài viết mới'}</h2>
        <Link to="/admin/posts" className="admin-post-editor__back">
          Quay lại danh sách bài viết
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="admin-post-editor__layout">
          {/* ——— Main column ——— */}
          <div className="admin-post-editor__main">
            <div className="admin-post-editor__field">
              <label className="admin-post-editor__field-label admin-post-editor__field-label--required" htmlFor="post-title">
                Tiêu đề bài viết
              </label>
              <input
                id="post-title"
                className="admin-post-editor__input"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Nhập tiêu đề"
              />
              {errors.title ? <p className="admin-post-editor__error">{errors.title}</p> : null}
            </div>

            <div className="admin-post-editor__field">
              <div className="admin-post-editor__content-head">
                <span className="admin-post-editor__field-label admin-post-editor__field-label--required">
                  Nội dung chính
                </span>
                <div className="admin-post-editor__mode-toggle">
                  <button
                    type="button"
                    className={`admin-post-editor__mode-btn${contentMode === 'richtext' ? ' admin-post-editor__mode-btn--active' : ''}`}
                    onClick={() => switchContentMode('richtext')}
                  >
                    RichText
                  </button>
                  <button
                    type="button"
                    className={`admin-post-editor__mode-btn${contentMode === 'html' ? ' admin-post-editor__mode-btn--active' : ''}`}
                    onClick={() => switchContentMode('html')}
                  >
                    HTML
                  </button>
                </div>
              </div>

              {contentMode === 'html' ? (
                <>
                  <div className="admin-post-editor__html-toolbar">
                    <label className="admin-post-editor__upload-btn">
                      <input
                        type="file"
                        accept={IMAGE_ACCEPT}
                        onChange={handleContentImageUpload}
                        disabled={contentImageBusy}
                        hidden
                      />
                      {contentImageBusy ? 'Đang tải…' : '↑ Upload ảnh'}
                    </label>
                    <button
                      type="button"
                      className="admin-post-editor__upload-btn"
                      onClick={() => openMediaLibrary('content')}
                    >
                      Thư viện media
                    </button>
                    <span className="admin-post-editor__hint" style={{ margin: 0 }}>
                      Ảnh upload sẽ được chèn tại vị trí con trỏ dưới dạng thẻ &lt;img&gt;
                    </span>
                  </div>
                  <textarea
                    ref={htmlTextareaRef}
                    className="admin-post-editor__textarea"
                    name="contentHtml"
                    value={formData.contentHtml}
                    onChange={handleHtmlChange}
                    placeholder="Dán HTML vào đây…"
                  />
                  <p className="admin-post-editor__hint">
                    Lưu ý: nếu chuyển từ HTML sang RichText rồi quay lại, nội dung có thể bị Quill &quot;dọn&quot; lại
                    (bỏ style/class tùy chỉnh).
                  </p>
                </>
              ) : (
                <div>
                  <div className="admin-post-editor__html-toolbar" style={{ marginBottom: 8 }}>
                    <button
                      type="button"
                      className="admin-post-editor__upload-btn"
                      onClick={() => openMediaLibrary('content')}
                    >
                      Thư viện media
                    </button>
                  </div>
                  <ReactQuill
                    key={isEdit ? `quill-${postId}-${quillMountEpoch}` : 'quill-create'}
                    ref={quillRef}
                    theme="snow"
                    value={formData.contentHtml}
                    onChange={handleEditorChange}
                    modules={quillModules}
                    formats={quillFormats}
                  />
                </div>
              )}
              {errors.contentHtml ? <p className="admin-post-editor__error">{errors.contentHtml}</p> : null}
            </div>

            <div className="admin-post-editor__field">
              <span className="admin-post-editor__field-label">Ảnh đại diện</span>
              <div className="admin-post-editor__avatar-row">
                <label className="admin-post-editor__upload-btn">
                  <input
                    type="file"
                    accept={IMAGE_ACCEPT}
                    onChange={handleTitleFile}
                    disabled={titleFileBusy}
                    hidden
                  />
                  {titleFileBusy ? 'Đang tải…' : '↑ Upload từ thiết bị'}
                </label>
                <button
                  type="button"
                  className="admin-post-editor__upload-btn"
                  onClick={() => openMediaLibrary('title')}
                >
                  Chọn từ thư viện
                </button>
                <input
                  className="admin-post-editor__input"
                  name="titleImage"
                  value={formData.titleImage}
                  onChange={handleInputChange}
                  onBlur={applyTitleImageUrl}
                  placeholder="Hoặc dán URL ảnh…"
                />
              </div>
              <p className="admin-post-editor__hint">
                Ảnh đại diện dùng làm thumbnail trang danh sách và thẻ Open Graph (og:image) khi chia sẻ.
              </p>
              {errors.titleImage ? <p className="admin-post-editor__error">{errors.titleImage}</p> : null}
              {titleImagePreview ? (
                <img src={titleImagePreview} alt="Ảnh đại diện" className="admin-post-editor__avatar-preview" />
              ) : null}
            </div>
          </div>

          {/* ——— Sidebar ——— */}
          <aside className="admin-post-editor__sidebar">
            <div className="admin-post-editor__panel">
              <button type="submit" className="admin-post-editor__submit" disabled={saving}>
                {saving ? 'Đang lưu…' : isEdit ? 'Lưu thay đổi' : 'Đăng bài viết'}
              </button>
            </div>

            <div className="admin-post-editor__panel">
              <h3 className="admin-post-editor__panel-title">Phân loại</h3>
              <p className="admin-post-editor__hint" style={{ marginTop: 0, marginBottom: 10 }}>
                Chọn nhanh
              </p>
              <div className="admin-post-editor__chips">
                {QUICK_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`admin-post-editor__chip${formData.category === cat ? ' admin-post-editor__chip--active' : ''}`}
                    onClick={() => selectCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <label className="admin-post-editor__field-label" htmlFor="post-category">
                Danh mục
              </label>
              <select
                id="post-category"
                className="admin-post-editor__select"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
              >
                <option value="">Chọn danh mục</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category ? <p className="admin-post-editor__error">{errors.category}</p> : null}

              <label className="admin-post-editor__field-label" htmlFor="post-tag-input" style={{ marginTop: 14 }}>
                Tags
              </label>
              <div className="admin-post-editor__tag-row">
                <input
                  id="post-tag-input"
                  className="admin-post-editor__input"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                  placeholder="Thêm tag…"
                />
                <button type="button" className="admin-post-editor__tag-add" onClick={addTag} aria-label="Thêm tag">
                  +
                </button>
              </div>
              {extraTags.length > 0 ? (
                <div className="admin-post-editor__tag-list">
                  {extraTags.map((tag) => (
                    <span key={tag} className="admin-post-editor__tag-item">
                      {tag}
                      <button type="button" className="admin-post-editor__tag-remove" onClick={() => removeTag(tag)}>
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="admin-post-editor__panel">
              <button
                type="button"
                className="admin-post-editor__seo-toggle"
                onClick={() => setSeoOpen((v) => !v)}
                aria-expanded={seoOpen}
              >
                Cài đặt SEO
                <span>{seoOpen ? '▾' : '▸'}</span>
              </button>
              {seoOpen ? (
                <div className="admin-post-editor__seo-body">
                  <div>
                    <label className="admin-post-editor__field-label" htmlFor="meta-title">
                      Meta Title
                    </label>
                    <input
                      id="meta-title"
                      className="admin-post-editor__input"
                      name="metaTitle"
                      value={formData.metaTitle}
                      onChange={handleInputChange}
                      placeholder="Để trống sẽ dùng tiêu đề bài viết"
                    />
                  </div>
                  <div>
                    <label className="admin-post-editor__field-label" htmlFor="meta-desc">
                      Meta Description
                    </label>
                    <textarea
                      id="meta-desc"
                      className="admin-post-editor__textarea"
                      style={{ minHeight: 80, fontFamily: 'inherit', fontSize: 14 }}
                      name="metaDescription"
                      value={formData.metaDescription}
                      onChange={handleInputChange}
                      placeholder="Để trống sẽ dùng mô tả ngắn (excerpt)"
                    />
                  </div>
                  <div>
                    <label className="admin-post-editor__field-label admin-post-editor__field-label--required" htmlFor="post-slug">
                      URL (slug)
                    </label>
                    <input
                      id="post-slug"
                      className="admin-post-editor__input"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      placeholder="slug-bai-viet"
                    />
                    <p className="admin-post-editor__hint">{getPostHref({ slug: formData.slug, id: postId || 'new' })}</p>
                  </div>
                  <div>
                    <label className="admin-post-editor__field-label" htmlFor="post-excerpt">
                      Mô tả ngắn (excerpt)
                    </label>
                    <textarea
                      id="post-excerpt"
                      className="admin-post-editor__textarea"
                      style={{ minHeight: 72, fontFamily: 'inherit', fontSize: 14 }}
                      name="excerpt"
                      value={formData.excerpt}
                      onChange={handleInputChange}
                      placeholder="Tóm tắt cho thẻ tin và trang danh sách"
                    />
                    {errors.excerpt ? <p className="admin-post-editor__error">{errors.excerpt}</p> : null}
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </form>

      {submitMessage ? (
        <p
          className={`admin-post-editor__message ${
            submitMessage.includes('thất bại') || submitMessage.includes('chưa') || submitMessage.includes('Lỗi')
              ? 'admin-post-editor__message--err'
              : 'admin-post-editor__message--ok'
          }`}
        >
          {submitMessage}
        </p>
      ) : null}

      <MediaLibraryModal
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        kind={mediaKind}
        onSelect={handleMediaSelect}
        selectLabel={mediaKind === 'title' ? 'Dùng làm ảnh đại diện' : 'Chèn vào bài'}
        onApplyToContent={mediaKind === 'content' ? handleApplyMediaSeoToContent : undefined}
      />
    </section>
  )
}

export default PostEditor
