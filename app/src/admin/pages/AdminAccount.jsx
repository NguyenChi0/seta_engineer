import { useCallback, useEffect, useState } from 'react'
import { deleteAdminUser, getAdminUsers, patchAdminUser, postAdminUser } from '../../api'

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

function IconUsers() {
  return (
    <IconSvg>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
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

function IconLock() {
  return (
    <IconSvg size={16}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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

function formatCreatedAt(iso) {
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

const emptyForm = {
  name: '',
  username: '',
  password: '',
  email: '',
  status: 1
}

function AdminAccount() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchQ, setSearchQ] = useState('')
  /** 1 = dang hoat dong (mac dinh), 0 = da khoa */
  const [statusFilter, setStatusFilter] = useState(1)

  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT)

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const load = useCallback(async (q, status) => {
    setError('')
    setLoading(true)
    try {
      const res = await getAdminUsers({ q: q || undefined, status })
      setUsers(res.users || [])
      setTotal(Number(res.total) || 0)
    } catch (e) {
      setError(e?.message || 'Khong tai duoc danh sach')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(searchQ, statusFilter)
  }, [load, searchQ, statusFilter])

  const openCreate = () => {
    setForm({ ...emptyForm, status: 1 })
    setModal('create')
  }

  const openEdit = (u) => {
    setForm({
      name: u.name || '',
      username: u.username || '',
      password: '',
      email: u.email || '',
      status: Number(u.status) === 0 ? 0 : 1
    })
    setModal({ type: 'edit', id: u.id })
  }

  const closeModal = () => {
    setModal(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (modal === 'create') {
        await postAdminUser({
          name: form.name,
          username: form.username,
          password: form.password,
          email: form.email,
          status: form.status
        })
      } else if (modal?.type === 'edit') {
        const body = {
          name: form.name,
          username: form.username,
          email: form.email,
          status: form.status
        }
        if (form.password && String(form.password).trim() !== '') {
          body.password = form.password
        }
        await patchAdminUser(modal.id, body)
      }
      closeModal()
      await load(searchQ, statusFilter)
    } catch (e2) {
      setError(e2?.message || 'Luu that bai')
    } finally {
      setSaving(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearchQ(searchInput.trim())
  }

  const handleDisable = async (u) => {
    if (!window.confirm(`Khoa tai khoan "${u.username}"? (status = 0)`)) {
      return
    }
    setError('')
    try {
      await deleteAdminUser(u.id)
      await load(searchQ, statusFilter)
    } catch (e) {
      setError(e?.message || 'Khoa that bai')
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
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 14 }}>
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
            <IconUsers />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: isMobile ? '30px' : '40px', lineHeight: 1.15, color: accent }}>Quản lý user</h2>
            <p style={{ margin: '8px 0 0', fontSize: isMobile ? '15px' : '18px', color: '#6b7280' }}>
              Chào mừng bạn đến với trang quản lý tài khoản.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreate}
          style={{
            marginTop: isMobile ? '0' : '6px',
            border: `2px solid ${accent}`,
            backgroundColor: '#fff',
            color: accent,
            borderRadius: '12px',
            height: isMobile ? '48px' : '56px',
            padding: '0 20px',
            fontSize: isMobile ? '16px' : '18px',
            fontWeight: 700,
            cursor: 'pointer',
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
          Tạo user mới
        </button>
      </div>

      {error ? (
        <p style={{ color: '#b91c1c', marginTop: 12, marginBottom: 0 }} role="alert">
          {error}
        </p>
      ) : null}

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
          <div style={{ fontSize: isMobile ? '17px' : '24px', color: '#6b7280', fontWeight: 600 }}>Tổng số tài khoản</div>
          <div style={{ fontSize: isMobile ? '32px' : '46px', lineHeight: 1.05, fontWeight: 800, color: accent }}>{total}</div>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          display: 'flex',
          flexWrap: isMobile ? 'nowrap' : 'wrap',
          alignItems: 'center',
          gap: 10,
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center'
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>Lọc trạng thái</span>
        <div
          style={{
            display: 'inline-flex',
            borderRadius: 10,
            border: `1px solid ${accentSoft}`,
            overflow: 'hidden',
            background: '#fff',
            width: isMobile ? '100%' : undefined
          }}
        >
          <button
            type="button"
            onClick={() => setStatusFilter(1)}
            style={{
              border: 'none',
              padding: '10px 16px',
              fontSize: isMobile ? 14 : 15,
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: statusFilter === 1 ? accent : 'transparent',
              color: statusFilter === 1 ? '#fff' : accent,
              flex: isMobile ? 1 : undefined
            }}
          >
            Đang hoạt động
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter(0)}
            style={{
              border: 'none',
              borderLeft: `1px solid ${accentSoft}`,
              padding: '10px 16px',
              fontSize: isMobile ? 14 : 15,
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: statusFilter === 0 ? accent : 'transparent',
              color: statusFilter === 0 ? '#fff' : accent,
              flex: isMobile ? 1 : undefined
            }}
          >
            Đã khóa
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSearch}
        style={{
          marginTop: '12px',
          border: `1px solid #e5e7eb`,
          backgroundColor: '#f8fafc',
          borderRadius: '10px',
          minHeight: '54px',
          padding: '0 12px 0 10px',
          display: 'flex',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          paddingBottom: isMobile ? 10 : 0,
          paddingTop: isMobile ? 10 : 0
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
            placeholder="Tìm theo username, tên hoặc email — Enter hoặc nút Tìm"
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
          {users.length === 0 ? (
            <div style={{ padding: 16, color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff' }}>
              Không có bản ghi nào.
            </div>
          ) : (
            users.map((u) => (
              <article
                key={u.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  background: '#fff',
                  padding: 12,
                  display: 'grid',
                  gap: 8
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>ID: {u.id}</div>
                    <div style={{ fontWeight: 700, color: '#111827', marginTop: 2 }}>{u.name || '—'}</div>
                    <div style={{ fontSize: 14, color: '#374151', marginTop: 2 }}>@{u.username}</div>
                  </div>
                  <span
                    style={{
                      color: Number(u.status) === 1 ? accent : '#9ca3af',
                      fontWeight: 700,
                      fontSize: 13,
                      border: `1px solid ${Number(u.status) === 1 ? accentSoft : '#e5e7eb'}`,
                      borderRadius: 999,
                      padding: '3px 9px',
                      background: Number(u.status) === 1 ? accentSoft : '#f9fafb'
                    }}
                  >
                    {Number(u.status) === 1 ? 'Hoạt động' : 'Đã khóa'}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: '#4b5563' }}>Email: {u.email || '—'}</div>
                <div style={{ fontSize: 14, color: '#4b5563' }}>Tạo lúc: {formatCreatedAt(u.createdAt)}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => openEdit(u)}
                    style={{
                      border: `1px solid ${accentSoft}`,
                      backgroundColor: '#fff',
                      color: accent,
                      borderRadius: 8,
                      padding: '7px 10px',
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      flex: 1,
                      justifyContent: 'center'
                    }}
                  >
                    <IconPencil /> Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDisable(u)}
                    disabled={Number(u.status) !== 1}
                    style={{
                      border: '1px solid #fecaca',
                      backgroundColor: Number(u.status) === 1 ? '#fef2f2' : '#f3f4f6',
                      color: Number(u.status) === 1 ? '#b91c1c' : '#9ca3af',
                      borderRadius: 8,
                      padding: '7px 10px',
                      fontSize: 13,
                      cursor: Number(u.status) === 1 ? 'pointer' : 'not-allowed',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      flex: 1,
                      justifyContent: 'center'
                    }}
                  >
                    <span style={{ opacity: Number(u.status) === 1 ? 1 : 0.5 }} aria-hidden>
                      <IconLock />
                    </span>
                    Khóa
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
              gridTemplateColumns: '72px 1.1fr 1.2fr 1.4fr 1.2fr 120px 170px',
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
            <div>Tên</div>
            <div>Username</div>
            <div>Email</div>
            <div>Tạo lúc</div>
            <div>TT</div>
            <div style={{ textAlign: 'center' }}>Thao tác</div>
          </div>

          {users.length === 0 ? (
            <div style={{ padding: 24, color: '#6b7280' }}>Không có bản ghi nào.</div>
          ) : (
            users.map((u, index) => (
              <div
                key={u.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '72px 1.1fr 1.2fr 1.4fr 1.2fr 120px 170px',
                  gap: '8px',
                  padding: '14px 16px',
                  borderBottom: index === users.length - 1 ? 'none' : '1px solid #e5e7eb',
                  fontSize: '15px',
                  alignItems: 'center'
                }}
              >
                <div style={{ color: '#374151', fontWeight: 600 }}>{u.id}</div>
                <div style={{ color: '#111827' }}>{u.name || '—'}</div>
                <div style={{ color: '#111827' }}>{u.username}</div>
                <div style={{ color: '#4b5563' }}>{u.email || '—'}</div>
                <div style={{ color: '#4b5563', fontSize: '14px' }}>{formatCreatedAt(u.createdAt)}</div>
                <div style={{ color: Number(u.status) === 1 ? accent : '#9ca3af', fontWeight: 600, fontSize: 14 }}>
                  {Number(u.status) === 1 ? 'Hoạt động' : 'Đã khóa'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => openEdit(u)}
                    style={{
                      border: `1px solid ${accentSoft}`,
                      backgroundColor: '#fff',
                      color: accent,
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <IconPencil /> Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDisable(u)}
                    disabled={Number(u.status) !== 1}
                    style={{
                      border: '1px solid #fecaca',
                      backgroundColor: Number(u.status) === 1 ? '#fef2f2' : '#f3f4f6',
                      color: Number(u.status) === 1 ? '#b91c1c' : '#9ca3af',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '13px',
                      cursor: Number(u.status) === 1 ? 'pointer' : 'not-allowed',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <span style={{ opacity: Number(u.status) === 1 ? 1 : 0.5 }} aria-hidden>
                      <IconLock />
                    </span>
                    Khóa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {modal ? (
        <div
          role="dialog"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 200,
            padding: 16
          }}
          onClick={closeModal}
        >
          <form
            onClick={(ev) => ev.stopPropagation()}
            onSubmit={handleSubmit}
            style={{
              width: '100%',
              maxWidth: isMobile ? 520 : 420,
              background: '#fff',
              borderRadius: 12,
              padding: isMobile ? 16 : 24,
              display: 'grid',
              gap: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              maxHeight: isMobile ? '90vh' : undefined,
              overflowY: isMobile ? 'auto' : undefined
            }}
          >
            <h3 style={{ margin: 0 }}>
              {modal === 'create' ? 'Tạo user mới' : 'Sửa user'}
            </h3>
            <label style={{ display: 'grid', gap: 4, fontSize: 14 }}>
              <span>Họ tên *</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                style={{ border: '1px solid #d1d5db', borderRadius: 8, height: 40, padding: '0 10px' }}
              />
            </label>
            <label style={{ display: 'grid', gap: 4, fontSize: 14 }}>
              <span>Username *</span>
              <input
                required
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                style={{ border: '1px solid #d1d5db', borderRadius: 8, height: 40, padding: '0 10px' }}
              />
            </label>
            {modal === 'create' ? (
              <label style={{ display: 'grid', gap: 4, fontSize: 14 }}>
                <span>Mật khẩu *</span>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  style={{ border: '1px solid #d1d5db', borderRadius: 8, height: 40, padding: '0 10px' }}
                />
              </label>
            ) : (
              <label style={{ display: 'grid', gap: 4, fontSize: 14 }}>
                <span>Mật khẩu mới (để trống nếu giữ nguyên)</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  style={{ border: '1px solid #d1d5db', borderRadius: 8, height: 40, padding: '0 10px' }}
                  placeholder="Không đổi nếu để trống"
                />
              </label>
            )}
            <label style={{ display: 'grid', gap: 4, fontSize: 14 }}>
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                style={{ border: '1px solid #d1d5db', borderRadius: 8, height: 40, padding: '0 10px' }}
                placeholder="optional@seta.vn"
              />
            </label>
            <label style={{ display: 'grid', gap: 4, fontSize: 14 }}>
              <span>Trạng thái (1=hoạt động, 0=khóa)</span>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: Number(e.target.value) }))}
                style={{ border: '1px solid #d1d5db', borderRadius: 8, height: 40, padding: '0 8px' }}
              >
                <option value={1}>1 - Hoạt động</option>
                <option value={0}>0 - Khóa</option>
              </select>
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                type="button"
                onClick={closeModal}
                style={{ flex: 1, padding: 10, border: '1px solid #d1d5db', background: '#fff', borderRadius: 8, cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{ flex: 1, padding: 10, border: 'none', background: accent, color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
              >
                {saving ? 'Đang lưu…' : 'Lưu'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  )
}

export default AdminAccount
