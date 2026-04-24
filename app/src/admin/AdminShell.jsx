import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'

const MOBILE_BREAKPOINT = 960

function AdminShell() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= MOBILE_BREAKPOINT)
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > MOBILE_BREAKPOINT)

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT
      setIsMobile(mobile)
      setSidebarOpen(!mobile)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!isMobile) {
      return
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = prev
    }
  }, [isMobile, sidebarOpen])

  const toggleSidebar = () => setSidebarOpen((v) => !v)
  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '"Montserrat", "Noto Sans JP", sans-serif' }}>
      <Navbar isMobile={isMobile} onToggleSidebar={toggleSidebar} />

      {isMobile && sidebarOpen ? (
        <button
          aria-label="Đóng menu"
          onClick={closeSidebar}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.52)',
            border: 'none',
            zIndex: 30
          }}
        />
      ) : null}

      <div style={{ display: 'flex', gap: isMobile ? '0' : '24px', padding: isMobile ? '14px' : '24px', minHeight: 'calc(100vh - 64px)' }}>
        <Sidebar isMobile={isMobile} isOpen={sidebarOpen} onClose={closeSidebar} />

        <main style={{ flex: 1, backgroundColor: '#fff', borderRadius: '8px', padding: isMobile ? '14px' : '20px', minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminShell
