import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/account', label: 'Account' },
  { to: '/admin/posts', label: 'Posts' }
]

function Sidebar({ isMobile, isOpen, onClose }) {
  const sideStyle = isMobile
    ? {
        position: 'fixed',
        top: 64,
        left: 0,
        bottom: 0,
        width: '78vw',
        maxWidth: 290,
        backgroundColor: '#fff',
        borderRadius: 0,
        borderRight: '1px solid #e5e7eb',
        padding: '14px',
        zIndex: 35,
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform .2s ease'
      }
    : {
        width: '240px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        padding: '16px',
        alignSelf: 'flex-start',
        position: 'sticky',
        top: 84
      }

  return (
    <aside style={sideStyle} aria-hidden={isMobile ? !isOpen : undefined}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              padding: '10px 12px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 600,
              color: isActive ? '#1d4ed8' : '#1f2937',
              backgroundColor: isActive ? '#dbeafe' : 'transparent'
            })}
            onClick={isMobile ? onClose : undefined}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
