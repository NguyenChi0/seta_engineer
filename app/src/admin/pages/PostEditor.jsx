import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import {
  getAdminPost,
  patchAdminPost,
  postAdminPost,
  uploadAdminPostImage,
  uploadAdminTitleImage
} from '../../api'
import { buildPostPayload, validatePostForm } from '../services/postPayload'
import { resolveApiAssetUrl, resolveApiAssetUrlsInHtml } from '../../utils/assetUrl'

const accent = '#034a5a'
const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'
const MOBILE_BREAKPOINT = 900

function formatPreviewDate(value) {
  const d = value ? new Date(value) : new Date()
  if (Number.isNaN(d.getTime())) {
    return ''
  }
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

/**
 * @param {{ mode: 'create' | 'edit' }} props
 */
function PostEditor({ mode }) {
  const { id: idParam } = useParams()
  const navigate = useNavigate()
  const quillRef = useRef(null)
  const isEdit = mode === 'edit'
  const postId = idParam ? Number(idParam) : null

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    excerpt: '',
    titleImage: '',
    contentHtml: ''
  })
  const [errors, setErrors] = useState({})
  const [submitMessage, setSubmitMessage] = useState('')
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingPost, setLoadingPost] = useState(isEdit)
  const [titleFileBusy, setTitleFileBusy] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT)

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!isEdit) {
      setLoadingPost(false)
      setLoadError('')
      return
    }
    if (!postId || !Number.isInteger(postId) || postId < 1) {
      setLoadingPost(false)
      setLoadError('ID bai viet khong hop le')
      return
    }
    let cancelled = false
    ;(async () => {
      setLoadingPost(true)
      setLoadError('')
      setSubmitMessage('')
      try {
        const { post } = await getAdminPost(postId)
        if (cancelled || !post) {
          return
        }
        setFormData({
          title: post.title || '',
          category: post.tags || '',
          excerpt: post.excerpt || '',
          titleImage: post.titleImage || '',
          contentHtml: post.content || ''
        })
      } catch (e) {
        if (!cancelled) {
          setLoadError(e?.message || 'Khong tai duoc bai viet')
        }
      } finally {
        if (!cancelled) {
          setLoadingPost(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isEdit, postId])

  const imageHandler = useCallback(() => {
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', IMAGE_ACCEPT)
    input.click()
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        return
      }
      try {
        const { url } = await uploadAdminPostImage(file)
        const quill = quillRef.current?.getEditor?.()
        if (!quill) {
          return
        }
        const range = quill.getSelection(true)
        const index = range ? range.index : quill.getLength()
        quill.insertEmbed(index, 'image', url, 'user')
        quill.setSelection(index + 1, 0)
      } catch (e) {
        window.alert(e?.message || 'Tai anh that bai')
      }
    }
  }, [])

  const quillModules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['blockquote', 'code-block'],
          ['link', 'image'],
          ['clean']
        ],
        handlers: {
          image: imageHandler
        }
      }
    }),
    [imageHandler]
  )

  const quillFormats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'blockquote',
    'code-block',
    'link',
    'image'
  ]

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleEditorChange = (value) => {
    setFormData((prev) => ({ ...prev, contentHtml: value }))
    setErrors((prev) => ({ ...prev, contentHtml: '' }))
  }

  const handleTitleFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }
    setTitleFileBusy(true)
    setErrors((prev) => ({ ...prev, titleImage: '' }))
    try {
      const { url } = await uploadAdminTitleImage(file)
      setFormData((prev) => ({ ...prev, titleImage: url }))
    } catch (e) {
      setErrors((prev) => ({ ...prev, titleImage: e?.message || 'Tai anh that bai' }))
    } finally {
      setTitleFileBusy(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validatePostForm(formData)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setSubmitMessage('Form chua hop le, vui long kiem tra lai.')
      return
    }
    const payload = buildPostPayload(formData)
    setSaving(true)
    setSubmitMessage('')
    try {
      if (isEdit && postId) {
        await patchAdminPost(postId, payload)
        setSubmitMessage('Da cap nhat bai viet.')
      } else {
        await postAdminPost(payload)
        setSubmitMessage('Da tao bai viet.')
        navigate('/admin/posts')
      }
    } catch (e2) {
      setSubmitMessage(e2?.message || 'Luu that bai')
    } finally {
      setSaving(false)
    }
  }

  if (isEdit && loadingPost) {
    return (
      <section style={{ color: '#111827' }}>
        <p style={{ color: '#6b7280' }}>Dang tai bai viet…</p>
      </section>
    )
  }

  if (isEdit && loadError) {
    return (
      <section style={{ color: '#111827' }}>
        <p style={{ color: '#b91c1c' }} role="alert">
          {loadError}
        </p>
        <Link to="/admin/posts" style={{ color: accent }}>
          Quay lai danh sach
        </Link>
      </section>
    )
  }

  const previewDate = formatPreviewDate()
  const previewTag = formData.category?.trim() || 'お知らせ'
  const previewTitle = formData.title?.trim() || 'Tiêu đề bài viết sẽ hiển thị ở đây'
  
  const previewContent = resolveApiAssetUrlsInHtml(
    formData.contentHtml?.trim() || '<p>Nội dung rich text sẽ hiển thị ở đây.</p>'
  )

  return (
    <section style={{ color: '#111827', fontFamily: '"Montserrat", "Noto Sans JP", sans-serif' }}>
      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
        Quản lý bài viết &nbsp;›&nbsp; {isEdit ? 'Sửa bài viết' : 'Tạo bài viết mới'}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          marginBottom: '20px',
          gap: 12,
          flexDirection: isMobile ? 'column' : 'row'
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? '28px' : '34px', lineHeight: 1.2, color: accent }}>
            {isEdit ? 'Sửa bài viết' : 'Tạo bài viết mới'}
          </h2>
          <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: isMobile ? 14 : 16 }}>
            Rich text lưu HTML; ảnh trong nội dung tải lên server; ảnh tiêu đề lưu vào thư mục riêng.
          </p>
        </div>
        <Link
          to="/admin/posts"
          style={{ color: accent, textDecoration: 'none', fontWeight: 600, alignSelf: isMobile ? 'flex-start' : 'auto' }}
        >
          Quay lại danh sách bài viết
        </Link>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
          <label style={{ display: 'grid', gap: '6px' }}>
            <span>Tiêu đề bài viết</span>
            <input
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Nhap tieu de bai viet"
              style={{ border: '1px solid #d1d5db', borderRadius: '8px', height: '42px', padding: '0 12px' }}
            />
            {errors.title ? <span style={{ color: '#b91c1c', fontSize: '13px' }}>{errors.title}</span> : null}
          </label>

          <label style={{ display: 'grid', gap: '6px' }}>
            <span>Danh mục (tags)</span>
            <input
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              placeholder="Tin cong ty / Blog / Su kien"
              style={{ border: '1px solid #d1d5db', borderRadius: '8px', height: '42px', padding: '0 12px' }}
            />
            {errors.category ? <span style={{ color: '#b91c1c', fontSize: '13px' }}>{errors.category}</span> : null}
          </label>
        </div>

        <label style={{ display: 'grid', gap: '6px' }}>
          <span>Mô tả ngắn (excerpt)</span>
          <textarea
            name="excerpt"
            value={formData.excerpt}
            onChange={handleInputChange}
            rows={3}
            placeholder="Tom tat ngan cho the tin va trang danh sach"
            style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px 12px' }}
          />
          {errors.excerpt ? <span style={{ color: '#b91c1c', fontSize: '13px' }}>{errors.excerpt}</span> : null}
        </label>

        <div style={{ display: 'grid', gap: '6px' }}>
          <span>Ảnh tiêu đề (tải file)</span>
          <input type="file" accept={IMAGE_ACCEPT} onChange={handleTitleFile} disabled={titleFileBusy} />
          {titleFileBusy ? <span style={{ fontSize: '13px', color: '#6b7280' }}>Đang tải ảnh…</span> : null}
          {errors.titleImage ? <span style={{ color: '#b91c1c', fontSize: '13px' }}>{errors.titleImage}</span> : null}
          {formData.titleImage ? (
            <img
              src={resolveApiAssetUrl(formData.titleImage)}
              alt="Anh tieu de"
              style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '6px' }}
            />
          ) : null}
        </div>

        <div style={{ display: 'grid', gap: '6px' }}>
          <span>Nội dung bài viết (Rich Text)</span>
          <div style={{ marginBottom: '6px' }}>
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={formData.contentHtml}
              onChange={handleEditorChange}
              modules={quillModules}
              formats={quillFormats}
            />
          </div>
          {errors.contentHtml ? <span style={{ color: '#b91c1c', fontSize: '13px' }}>{errors.contentHtml}</span> : null}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              border: 'none',
              backgroundColor: accent,
              color: '#fff',
              borderRadius: '8px',
              height: '42px',
              padding: '0 16px',
              fontWeight: 700,
              cursor: saving ? 'wait' : 'pointer',
              width: isMobile ? '100%' : undefined
            }}
          >
            {saving ? 'Dang luu…' : isEdit ? 'Lưu thay đổi' : 'Đăng bài viết'}
          </button>
        </div>
      </form>

      {submitMessage ? (
        <p
          style={{
            marginTop: '14px',
            color: submitMessage.includes('that bai') || submitMessage.includes('Loi') ? '#b91c1c' : '#166534'
          }}
        >
          {submitMessage}
        </p>
      ) : null}

      <div
        style={{
          marginTop: '18px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: isMobile ? '12px' : '16px',
          backgroundColor: '#f9fafb'
        }}
      >
        <h3 style={{ marginTop: 0 }}>Preview bài viết</h3>
        <article
          style={{
            maxWidth: 860,
            margin: '0 auto',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: isMobile ? '16px 12px' : '24px 20px',
            boxShadow: '0 6px 14px rgba(0,0,0,0.04)'
          }}
        >
          <h2 style={{ margin: '0 0 10px', textAlign: 'center', color: '#111827', lineHeight: 1.35, fontSize: isMobile ? 22 : 30 }}>{previewTitle}</h2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              margin: '0 auto 18px'
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 14px',
                borderRadius: 999,
                background: '#d82323',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 1
              }}
            >
              {previewTag}
            </span>
            <time style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.2, textAlign: 'center' }}>{previewDate}</time>
          </div>
          {formData.titleImage ? (
            <div style={{ marginBottom: 14 }}>
              <img
                src={resolveApiAssetUrl(formData.titleImage)}
                alt="Cover preview"
                style={{ width: '100%', maxHeight: isMobile ? 220 : 320, objectFit: 'cover', borderRadius: '8px' }}
              />
            </div>
          ) : null}
          
          <div dangerouslySetInnerHTML={{ __html: previewContent }} />
        </article>
      </div>
    </section>
  )
}

export default PostEditor
