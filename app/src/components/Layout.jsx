import { Outlet } from 'react-router-dom'
import Header from './layout/Header'
import Footer from './layout/Footer'
import ScrollToTop from './ScrollToTop'

export default function Layout() {
  return (
    <div className="site-shell">
      <ScrollToTop />
      <Header />
      <main className="site-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
