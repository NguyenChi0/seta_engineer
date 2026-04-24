import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteAdminPost, getAdminPosts } from '../../api'

const accent = '#034a5a'
const accentSoft = 'rgba(3, 74, 90, 0.1)'
const iconStroke = 1.75
const MOBILE_BREAKPOINT = 900

function IconSvg({ children, size = 22, className, title, ...rest }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={iconStroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}

function IconFilePost() {
  return (
    <IconSvg>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </IconSvg>
  )
}

function IconListDoc() {
  return (
    <IconSvg>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </IconSvg>
  )
}

function IconSearch() {
  return (
    <IconSvg>
      <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" />
      <path d="M21 21l-4.3-4.3" />
    </IconSvg>
  )
}

function IconPencil() {
  return (
    <IconSvg size={16}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5" />
    </IconSvg>
  )
}

function IconPlus() {
  return (
    <IconSvg size={20}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </IconSvg>
  )
}

function IconTrash() {
  return (
    <IconSvg size={16}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </IconSvg>
  )
}

function formatPostDate(iso) {
  if (!iso) {
    return '—'
  }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return '—'
  }
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function AdminPost() {
  const [posts, setPosts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT)

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const load = useCallback(async (q) => {
    setError('')
    setLoading(true)
    try {
      const res = await getAdminPosts({ q: q || undefined })
      setPosts(res.posts || [])
      setTotal(Number(res.total) || 0)
    } catch (e) {
      setError(e?.message || 'Khong tai duoc danh sach')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(searchQ)
  }, [load, searchQ])

  const handleDelete = async (post) => {
    if (!window.confirm(`Xoa bai viet "${post.title}"?`)) {
      return
    }
    setError('')
    try {
      await deleteAdminPost(post.id)
      await load(searchQ)
    } catch (e) {
      setError(e?.message || 'Xoa that bai')
    }
  }

  return (
    <section style={{ color: '#111827' }}>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'flex-start',
          gap: '16px',
          flexDirection: isMobile ? 'column' : 'row'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: accentSoft,
              color: accent,
              display: 'grid',
              placeItems: 'center'
            }}
            aria-hidden
          >
            <IconFilePost />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: isMobile ? '30px' : '40px', lineHeight: 1.15, color: accent }}>Quản lý bài viết</h2>
            <p style={{ margin: '8px 0 0', fontSize: isMobile ? '15px' : '18px', color: '#6b7280' }}>
              Theo dõi và cập nhật nội dung bài viết trong hệ thống.
            </p>
          </div>
        </div>

        <Link
          to="/admin/posts/create"
          style={{
            marginTop: isMobile ? 0 : '6px',
            border: `2px solid ${accent}`,
            backgroundColor: '#fff',
            color: accent,
            borderRadius: '12px',
            height: isMobile ? '48px' : '56px',
            padding: '0 20px',
            fontSize: isMobile ? '16px' : '18px',
            fontWeight: 700,
            cursor: 'pointer',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            justifyContent: 'center',
            width: isMobile ? '100%' : undefined
          }}
        >
          <span style={{ display: 'inline-flex', color: accent }} aria-hidden>
            <IconPlus />
          </span>
          Tạo bài viết mới
        </Link>
      </div>

      <div
        style={{
          marginTop: '24px',
          border: '1px solid #d1d5db',
          borderRadius: '0',
          backgroundColor: '#f8fafc',
          padding: isMobile ? '12px 14px' : '16px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '8px',
            backgroundColor: accentSoft,
            display: 'grid',
            placeItems: 'center',
            color: accent
          }}
        >
          <IconListDoc />
        </div>
        <div>
          <div style={{ fontSize: isMobile ? '17px' : '24px', color: '#6b7280', fontWeight: 600 }}>Tổng số bài viết</div>
          <div style={{ fontSize: isMobile ? '32px' : '46px', lineHeight: 1.05, fontWeight: 800, color: accent }}>{total}</div>
        </div>
      </div>

      {error ? (
        <p style={{ color: '#b91c1c', marginTop: 12, marginBottom: 0 }} role="alert">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          setSearchQ(searchInput.trim())
        }}
        style={{
          marginTop: '18px',
          border: '1px solid #e5e7eb',
          backgroundColor: '#f8fafc',
          borderRadius: '10px',
          minHeight: '54px',
          padding: '0 12px 0 10px',
          display: 'flex',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          paddingBottom: isMobile ? 10 : 0
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flex: 1,
            minWidth: 0,
            width: isMobile ? '100%' : undefined
          }}
        >
          <span style={{ display: 'flex', color: accent, paddingLeft: 2 }} aria-hidden>
            <IconSearch />
          </span>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm theo tiêu đề bài viết — Enter hoặc nút Tìm"
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: isMobile ? '16px' : '18px',
              color: '#111827',
              outline: 'none',
              minWidth: 0
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            border: `1px solid ${accent}`,
            background: '#fff',
            color: accent,
            borderRadius: 8,
            padding: '8px 16px',
            fontWeight: 600,
            cursor: 'pointer',
            width: isMobile ? '100%' : undefined
          }}
        >
          Tìm
        </button>
      </form>

      {loading ? (
        <p style={{ marginTop: 16, color: '#6b7280' }}>Đang tải…</p>
      ) : isMobile ? (
        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          {posts.length === 0 ? (
            <div style={{ padding: 16, color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff' }}>
              Không có bản ghi nào phù hợp.
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  background: '#fff',
                  padding: 12,
                  display: 'grid',
                  gap: 8
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: '#6b7280', fontSize: 12 }}>ID: {post.id}</div>
                    <div style={{ color: '#111827', fontWeight: 700, marginTop: 2, lineHeight: 1.35 }}>{post.title}</div>
                  </div>
                  <span
                    style={{
                      color: accent,
                      fontWeight: 700,
                      fontSize: 12,
                      border: `1px solid ${accentSoft}`,
                      borderRadius: 999,
                      padding: '3px 9px',
                      background: accentSoft
                    }}
                  >
                    {post.category || '—'}
                  </span>
                </div>
                <div style={{ color: '#4b5563', fontSize: 14 }}>Ngày đăng: {formatPostDate(post.createdAt)}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link
                    to={`/admin/posts/${post.id}/edit`}
                    style={{
                      border: `1px solid ${accentSoft}`,
                      backgroundColor: '#fff',
                      color: accent,
                      borderRadius: '8px',
                      padding: '7px 10px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      flex: 1,
                      justifyContent: 'center'
                    }}
                  >
                    <IconPencil /> Sửa
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(post)}
                    style={{
                      border: '1px solid #fecaca',
                      backgroundColor: '#fef2f2',
                      color: '#b91c1c',
                      borderRadius: '8px',
                      padding: '7px 10px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      flex: 1,
                      justifyContent: 'center'
                    }}
                  >
                    <span aria-hidden>
                      <IconTrash />
                    </span>
                    Xóa
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      ) : (
        <div
          style={{
            marginTop: '20px',
            border: '1px solid #d1d5db',
            backgroundColor: '#fff'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '90px 2fr 140px 150px 170px',
              gap: '8px',
              padding: '14px 16px',
              backgroundColor: accent,
              borderBottom: '1px solid rgba(0,0,0,0.12)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700
            }}
          >
            <div>ID</div>
            <div>Tiêu đề</div>
            <div>Danh mục</div>
            <div>Ngày đăng</div>
            <div style={{ textAlign: 'center' }}>Thao tác</div>
          </div>

          {posts.length === 0 ? (
            <div style={{ padding: 24, color: '#6b7280' }}>Không có bản ghi nào phù hợp.</div>
          ) : (
            posts.map((post, index) => (
              <div
                key={post.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '90px 2fr 140px 150px 170px',
                  gap: '8px',
                  padding: '14px 16px',
                  borderBottom: index === posts.length - 1 ? 'none' : '1px solid #e5e7eb',
                  fontSize: '15px',
                  alignItems: 'center'
                }}
              >
                <div style={{ color: '#374151', fontWeight: 600 }}>{post.id}</div>
                <div style={{ color: '#111827' }}>{post.title}</div>
                <div style={{ color: accent, fontWeight: 600 }}>{post.category}</div>
                <div style={{ color: '#4b5563' }}>{formatPostDate(post.createdAt)}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <Link
                    to={`/admin/posts/${post.id}/edit`}
                    style={{
                      border: `1px solid ${accentSoft}`,
                      backgroundColor: '#fff',
                      color: accent,
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <IconPencil /> Sửa
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(post)}
                    style={{
                      border: '1px solid #fecaca',
                      backgroundColor: '#fef2f2',
                      color: '#b91c1c',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <span aria-hidden>
                      <IconTrash />
                    </span>
                    Xóa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  )
}

export default AdminPost
