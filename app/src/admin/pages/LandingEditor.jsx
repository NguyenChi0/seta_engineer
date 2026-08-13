import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  getAdminLandingPage,
  patchAdminLandingPage,
  postAdminLandingPage,
  uploadAdminPostImage
} from '../../api'
import { buildLandingPayload, validateLandingForm } from '../services/landingPayload'
import { prepareLandingShadowContent, stripUnsafeHtml } from '../../utils/landingHtml'
import { getLandingHref } from '../../utils/reservedSlugs'
import { slugify } from '../../utils/slugify'
import { resolveApiAssetUrlsInHtml } from '../../utils/assetUrl'
import { buildImageTag, updateImageSeoInHtml } from '../../utils/imageHtml'
import MediaLibraryModal from '../components/MediaLibraryModal'
import './postEditor.css'

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'

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

function normalizeContent(raw) {
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

/**
 * @param {{ mode: 'create' | 'edit' }} props
 */
export default function LandingEditor({ mode }) {
  const { id: idParam } = useParams()
  const navigate = useNavigate()
  const htmlTextareaRef = useRef(null)
  const previewRef = useRef(null)
  const isEdit = mode === 'edit'
  const pageId = idParam ? Number(idParam) : null

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    contentHtml: '',
    metaTitle: '',
    metaDescription: '',
    published: true
  })
  const [slugTouched, setSlugTouched] = useState(false)
  const [seoOpen, setSeoOpen] = useState(true)
  const [errors, setErrors] = useState({})
  const [submitMessage, setSubmitMessage] = useState('')
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingPage, setLoadingPage] = useState(isEdit)
  const [importBusy, setImportBusy] = useState(false)
  const [contentImageBusy, setContentImageBusy] = useState(false)
  const [mediaOpen, setMediaOpen] = useState(false)

  useLayoutEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/assets/custom-landing-page.css`
    document.head.appendChild(link)
    return () => link.remove()
  }, [])

  useEffect(() => {
    if (!isEdit) {
      setLoadingPage(false)
      return
    }
    if (!pageId || !Number.isInteger(pageId) || pageId < 1) {
      setLoadingPage(false)
      setLoadError('ID khong hop le')
      return
    }
    let cancelled = false
    ;(async () => {
      setLoadingPage(true)
      setLoadError('')
      try {
        const { page } = await getAdminLandingPage(pageId)
        if (cancelled || !page) return
        setFormData({
          title: page.title || '',
          slug: page.slug || '',
          contentHtml: normalizeContent(page.content),
          metaTitle: page.metaTitle || '',
          metaDescription: page.metaDescription || '',
          published: page.status !== 0
        })
        setSlugTouched(Boolean(page.slug))
      } catch (e) {
        if (!cancelled) setLoadError(e?.message || 'Khong tai duoc trang')
      } finally {
        if (!cancelled) setLoadingPage(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isEdit, pageId])

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target
    if (name === 'slug') setSlugTouched(true)
    setFormData((prev) => {
      const next = { ...prev, [name]: type === 'checkbox' ? checked : value }
      if (name === 'title' && !slugTouched) next.slug = slugify(value)
      return next
    })
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleImportHtmlFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || importBusy) return
    setImportBusy(true)
    try {
      const raw = await file.text()
      setFormData((prev) => ({ ...prev, contentHtml: stripUnsafeHtml(raw) }))
    } catch (e) {
      window.alert(e?.message || 'Import HTML that bai')
    } finally {
      setImportBusy(false)
    }
  }

  const handleContentImageUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setContentImageBusy(true)
    try {
      const { url } = await uploadAdminPostImage(file)
      const imgTag = `<img src="${url}" alt="" />`
      const next = insertAtCursor(htmlTextareaRef.current, imgTag)
      if (next != null) {
        setFormData((prev) => ({ ...prev, contentHtml: next }))
      } else {
        setFormData((prev) => ({ ...prev, contentHtml: `${prev.contentHtml}${imgTag}` }))
      }
      setErrors((prev) => ({ ...prev, contentHtml: '' }))
    } catch (e) {
      window.alert(e?.message || 'Tai anh that bai')
    } finally {
      setContentImageBusy(false)
    }
  }

  const insertContentImage = (item) => {
    const imgTag = buildImageTag(item.url, { alt: item.altText, title: item.titleAttr })
    const next = insertAtCursor(htmlTextareaRef.current, imgTag)
    setFormData((prev) => ({
      ...prev,
      contentHtml: next != null ? next : `${prev.contentHtml}${imgTag}`
    }))
    setErrors((prev) => ({ ...prev, contentHtml: '' }))
  }

  const handleApplyMediaSeoToContent = (item) => {
    setFormData((prev) => ({
      ...prev,
      contentHtml: updateImageSeoInHtml(prev.contentHtml, item.url, {
        alt: item.altText,
        title: item.titleAttr
      })
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validateLandingForm(formData)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setSubmitMessage('Form chua hop le, vui long kiem tra lai.')
      return
    }
    const payload = buildLandingPayload(formData)
    setSaving(true)
    setSubmitMessage('')
    try {
      if (isEdit && pageId) {
        await patchAdminLandingPage(pageId, payload)
        setSubmitMessage('Da cap nhat landing page.')
      } else {
        await postAdminLandingPage(payload)
        setSubmitMessage('Da tao landing page.')
        navigate('/admin/landing-pages')
      }
    } catch (e2) {
      setSubmitMessage(e2?.message || 'Luu that bai')
    } finally {
      setSaving(false)
    }
  }

  if (isEdit && loadingPage) {
    return (
      <section className="admin-post-editor">
        <p style={{ color: '#6b7280' }}>Dang tai…</p>
      </section>
    )
  }

  if (isEdit && loadError) {
    return (
      <section className="admin-post-editor">
        <p className="admin-post-editor__message admin-post-editor__message--err">{loadError}</p>
        <Link to="/admin/landing-pages" className="admin-post-editor__back">
          Quay lai danh sach
        </Link>
      </section>
    )
  }

  const previewHtml = resolveApiAssetUrlsInHtml(prepareLandingShadowContent(formData.contentHtml))

  useEffect(() => {
    const host = previewRef.current
    if (!host) return
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' })
    shadow.innerHTML =
      previewHtml || '<p style="padding:16px;color:#6b7280;font-family:sans-serif;">Noi dung preview…</p>'
  }, [previewHtml])

  return (
    <section className="admin-post-editor">
      <div className="admin-post-editor__breadcrumb">
        Landing page › {isEdit ? 'Sua trang' : 'Tao trang moi'}
      </div>

      <div className="admin-post-editor__header">
        <h2 className="admin-post-editor__title">{isEdit ? 'Sua landing page' : 'Tao landing page'}</h2>
        <Link to="/admin/landing-pages" className="admin-post-editor__back">
          Quay lai danh sach
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="admin-post-editor__layout">
          <div className="admin-post-editor__main">
            <div className="admin-post-editor__field">
              <label className="admin-post-editor__field-label admin-post-editor__field-label--required" htmlFor="lp-title">
                Ten trang (noi bo)
              </label>
              <input
                id="lp-title"
                className="admin-post-editor__input"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Vi du: Campaign mua he 2026"
              />
              {errors.title ? <p className="admin-post-editor__error">{errors.title}</p> : null}
            </div>

            <div className="admin-post-editor__field">
              <div className="admin-post-editor__content-head">
                <span className="admin-post-editor__field-label admin-post-editor__field-label--required">
                  Noi dung HTML
                </span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <label className="admin-post-editor__upload-btn">
                    <input
                      type="file"
                      accept={IMAGE_ACCEPT}
                      onChange={handleContentImageUpload}
                      disabled={contentImageBusy}
                      hidden
                    />
                    {contentImageBusy ? 'Dang tai…' : '↑ Upload anh'}
                  </label>
                  <button
                    type="button"
                    className="admin-post-editor__upload-btn"
                    onClick={() => setMediaOpen(true)}
                  >
                    Thu vien media
                  </button>
                  <label className="admin-post-editor__upload-btn">
                    <input
                      type="file"
                      accept=".html,.htm,.txt,text/html,text/plain"
                      onChange={handleImportHtmlFile}
                      disabled={importBusy}
                      hidden
                    />
                    {importBusy ? 'Dang import…' : 'Import file HTML'}
                  </label>
                </div>
              </div>
              <p className="admin-post-editor__hint" style={{ marginTop: 0, marginBottom: 10 }}>
                Anh upload se duoc chen tai vi tri con tro duoi dang the &lt;img&gt; (cung API voi bai viet).
              </p>
              <textarea
                ref={htmlTextareaRef}
                className="admin-post-editor__textarea"
                name="contentHtml"
                value={formData.contentHtml}
                onChange={handleInputChange}
                placeholder="Dan HTML vao day (co the la full trang hoac doan snippet)…"
                style={{ minHeight: 420 }}
              />
              <p className="admin-post-editor__hint">
                Trang se hien thi tai{' '}
                <strong>{getLandingHref(formData.slug || slugify(formData.title) || 'slug')}</strong> — khong co header/footer
                site, chi render HTML ban dan.
              </p>
              {errors.contentHtml ? <p className="admin-post-editor__error">{errors.contentHtml}</p> : null}
            </div>

            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                padding: 16,
                background: '#f9fafb'
              }}
            >
              <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Preview</h3>
              <div
                ref={previewRef}
                className="custom-landing-page"
                style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, minHeight: 120 }}
              />
            </div>
          </div>

          <aside className="admin-post-editor__sidebar">
            <div className="admin-post-editor__panel">
              <button type="submit" className="admin-post-editor__submit" disabled={saving}>
                {saving ? 'Dang luu…' : isEdit ? 'Luu thay doi' : 'Tao trang'}
              </button>
            </div>

            <div className="admin-post-editor__panel">
              <h3 className="admin-post-editor__panel-title">URL</h3>
              <label className="admin-post-editor__field-label admin-post-editor__field-label--required" htmlFor="lp-slug">
                Slug
              </label>
              <input
                id="lp-slug"
                className="admin-post-editor__input"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                placeholder="ten-trang-landing"
              />
              <p className="admin-post-editor__hint" style={{ wordBreak: 'break-all' }}>
                {getLandingHref(formData.slug || 'slug')}
              </p>
              {errors.slug ? <p className="admin-post-editor__error">{errors.slug}</p> : null}

              <label className="admin-post-editor__checkbox" style={{ marginTop: 14 }}>
                <input
                  type="checkbox"
                  name="published"
                  checked={formData.published}
                  onChange={handleInputChange}
                />
                Xuat ban (hien thi cong khai)
              </label>
            </div>

            <div className="admin-post-editor__panel">
              <button
                type="button"
                className="admin-post-editor__seo-toggle"
                onClick={() => setSeoOpen((v) => !v)}
                aria-expanded={seoOpen}
              >
                Cai dat SEO
                <span>{seoOpen ? '▾' : '▸'}</span>
              </button>
              {seoOpen ? (
                <div className="admin-post-editor__seo-body">
                  <div>
                    <label className="admin-post-editor__field-label" htmlFor="lp-meta-title">
                      Meta Title
                    </label>
                    <input
                      id="lp-meta-title"
                      className="admin-post-editor__input"
                      name="metaTitle"
                      value={formData.metaTitle}
                      onChange={handleInputChange}
                      placeholder="De trong se dung ten trang"
                    />
                  </div>
                  <div>
                    <label className="admin-post-editor__field-label" htmlFor="lp-meta-desc">
                      Meta Description
                    </label>
                    <textarea
                      id="lp-meta-desc"
                      className="admin-post-editor__textarea"
                      style={{ minHeight: 80, fontFamily: 'inherit', fontSize: 14 }}
                      name="metaDescription"
                      value={formData.metaDescription}
                      onChange={handleInputChange}
                      placeholder="Mo ta ngan cho SEO"
                    />
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
            submitMessage.includes('that bai') || submitMessage.includes('chua')
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
        kind="content"
        onSelect={insertContentImage}
        onApplyToContent={handleApplyMediaSeoToContent}
      />
    </section>
  )
}
