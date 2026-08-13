import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteAdminLandingPage, getAdminLandingPages } from '../../api'
import { getLandingHref } from '../../utils/reservedSlugs'

const accent = '#034a5a'
const accentSoft = 'rgba(3, 74, 90, 0.1)'

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function AdminLanding() {
  const [pages, setPages] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchQ, setSearchQ] = useState('')

  const load = useCallback(async (q) => {
    setError('')
    setLoading(true)
    try {
      const res = await getAdminLandingPages({ q: q || undefined })
      setPages(res.pages || [])
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

  const handleDelete = async (page) => {
    if (!window.confirm(`Xoa landing page "${page.title}"?`)) return
    setError('')
    try {
      await deleteAdminLandingPage(page.id)
      await load(searchQ)
    } catch (e) {
      setError(e?.message || 'Xoa that bai')
    }
  }

  return (
    <section style={{ color: '#111827' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 34, color: accent }}>Landing page</h2>
          <p style={{ margin: '8px 0 0', color: '#6b7280' }}>
            Tao trang landing bang HTML — URL dang <code>/slug</code>
          </p>
        </div>
        <Link
          to="/admin/landing-pages/create"
          style={{
            border: `2px solid ${accent}`,
            background: '#fff',
            color: accent,
            borderRadius: 12,
            padding: '12px 20px',
            fontWeight: 700,
            textDecoration: 'none'
          }}
        >
          + Tao landing page
        </Link>
      </div>

      <div style={{ marginTop: 20, padding: '14px 18px', background: accentSoft, borderRadius: 8 }}>
        <div style={{ color: '#6b7280', fontWeight: 600 }}>Tong so trang</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: accent }}>{total}</div>
      </div>

      {error ? (
        <p style={{ color: '#b91c1c', marginTop: 12 }} role="alert">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          setSearchQ(searchInput.trim())
        }}
        style={{ marginTop: 16, display: 'flex', gap: 8 }}
      >
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Tim theo ten hoac slug…"
          style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px' }}
        />
        <button type="submit" style={{ border: `1px solid ${accent}`, background: '#fff', color: accent, borderRadius: 8, padding: '10px 16px', fontWeight: 600 }}>
          Tim
        </button>
      </form>

      {loading ? (
        <p style={{ marginTop: 16, color: '#6b7280' }}>Dang tai…</p>
      ) : (
        <div style={{ marginTop: 16, border: '1px solid #d1d5db' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '70px 1.5fr 1fr 100px 140px 160px',
              gap: 8,
              padding: '12px 14px',
              background: accent,
              color: '#fff',
              fontWeight: 700,
              fontSize: 14
            }}
          >
            <div>ID</div>
            <div>Ten</div>
            <div>URL</div>
            <div>Trang thai</div>
            <div>Ngay tao</div>
            <div style={{ textAlign: 'center' }}>Thao tac</div>
          </div>
          {pages.length === 0 ? (
            <div style={{ padding: 24, color: '#6b7280' }}>Chua co trang nao.</div>
          ) : (
            pages.map((page, index) => (
              <div
                key={page.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '70px 1.5fr 1fr 100px 140px 160px',
                  gap: 8,
                  padding: '12px 14px',
                  borderBottom: index === pages.length - 1 ? 'none' : '1px solid #e5e7eb',
                  alignItems: 'center',
                  fontSize: 14
                }}
              >
                <div>{page.id}</div>
                <div style={{ fontWeight: 600 }}>{page.title}</div>
                <div>
                  <a href={getLandingHref(page.slug)} target="_blank" rel="noreferrer" style={{ color: accent }}>
                    {getLandingHref(page.slug)}
                  </a>
                </div>
                <div>{page.status === 0 ? 'Nhap' : 'Cong khai'}</div>
                <div>{formatDate(page.createdAt)}</div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                  <Link
                    to={`/admin/landing-pages/${page.id}/edit`}
                    style={{ padding: '6px 10px', border: `1px solid ${accentSoft}`, borderRadius: 8, textDecoration: 'none', color: accent, fontSize: 13 }}
                  >
                    Sua
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(page)}
                    style={{ padding: '6px 10px', border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
                  >
                    Xoa
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
