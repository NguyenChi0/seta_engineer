import { Link, useNavigate } from 'react-router-dom'
import { clearAdminToken } from '../adminAuth'

function iconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 6h18" />
      <path d="M3 12h18" />
      <path d="M3 18h18" />
    </svg>
  )
}

const logoDark = `${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/assets/logo_dark.png`

function Navbar({ isMobile, onToggleSidebar }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAdminToken()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div
      role="banner"
      style={{
        height: '64px',
        backgroundColor: '#0f172a',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 14px' : '0 24px',
        borderBottom: '1px solid #1e293b',
        position: 'relative',
        zIndex: 40
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isMobile ? (
          <button
            type="button"
            onClick={onToggleSidebar}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: '1px solid #334155',
              background: '#0b1220',
              color: '#e2e8f0',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer'
            }}
            aria-label="Mở menu"
          >
            {iconMenu()}
          </button>
        ) : null}
        <img
          src={logoDark}
          alt="SETA Engineering"
          style={{
            height: isMobile ? 28 : 34,
            width: 'auto',
            objectFit: 'contain',
            display: 'block',
            filter: 'drop-shadow(0 0 0 rgba(0,0,0,0))'
          }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 20 }}>
        <Link style={{ color: '#93c5fd', textDecoration: 'none', fontWeight: 600 }} to="/">
          {isMobile ? 'Website' : 'Về trang website'}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '1px solid #475569',
            color: '#e2e8f0',
            borderRadius: 6,
            padding: isMobile ? '6px 10px' : '6px 12px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          {isMobile ? 'Thoát' : 'Đăng xuất'}
        </button>
      </div>
    </div>
  )
}

export default Navbar
