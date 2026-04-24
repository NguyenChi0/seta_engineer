import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getAdminMe, postAdminLogin } from '../../api'
import { clearAdminToken, getAdminToken, setAdminToken } from '../adminAuth'

function safeAdminRedirect(path) {
  if (!path || typeof path !== 'string') {
    return '/admin'
  }
  if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
    return path
  }
  return '/admin'
}

function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = safeAdminRedirect(searchParams.get('redirect'))

  useEffect(() => {
    const t = getAdminToken()
    if (!t) {
      setChecking(false)
      return
    }
    getAdminMe(t)
      .then(() => {
        navigate(redirect, { replace: true })
      })
      .catch(() => {
        clearAdminToken()
        setChecking(false)
      })
  }, [navigate, redirect])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token } = await postAdminLogin({ username, password })
      setAdminToken(token)
      navigate(redirect, { replace: true })
    } catch (err) {
      setError(err?.message || 'Dang nhap that bai.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          backgroundColor: '#f8fafc',
          fontFamily: '"Montserrat", "Noto Sans JP", sans-serif',
          color: '#374151'
        }}
      >
        Dang chuyen huong…
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        backgroundColor: '#f8fafc',
        fontFamily: '"Montserrat", "Noto Sans JP", sans-serif',
        color: '#111827'
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 400,
          backgroundColor: '#fff',
          padding: 32,
          borderRadius: 10,
          border: '1px solid #e5e7eb',
          display: 'grid',
          gap: 16
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24 }}>Đăng nhập</h1>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Tài khoản</span>
          <input
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ border: '1px solid #d1d5db', borderRadius: 8, height: 42, padding: '0 12px' }}
            required
          />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Mật khẩu</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ border: '1px solid #d1d5db', borderRadius: 8, height: 42, padding: '0 12px' }}
            required
          />
        </label>
        {error ? (
          <div style={{ color: '#b91c1c', fontSize: 14, marginTop: -4 }} role="alert">
            {error}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          style={{
            border: 'none',
            backgroundColor: '#1f5f86',
            color: '#fff',
            borderRadius: 8,
            height: 44,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.8 : 1
          }}
        >
          {loading ? 'Đang xử lý…' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  )
}

export default AdminLogin
