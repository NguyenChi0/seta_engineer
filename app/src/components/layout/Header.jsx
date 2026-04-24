import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const ASSETS = (import.meta.env.BASE_URL || '/') + 'assets/'

const SERVICE_OPTIONS = [
  { to: '/recruitment', jp: '\u30b0\u30ed\u30fc\u30d0\u30eb\u63a1\u7528\u30fb\u4eba\u6750\u6226\u7565\u652f\u63f4\u4e8b\u696d' },
  { to: '/recruitment/outsourcing', jp: '\u6280\u8853\u696d\u52d9\u30a2\u30a6\u30c8\u30bd\u30fc\u30b7\u30f3\u30b0' },
]

export default function Header() {
  const location = useLocation()
  const [megaOpen, setMegaOpen] = useState(false)
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false)
  const serviceDropdownRef = useRef(null)

  const megaBtnRef = useRef(null)
  const megaTargetRef = useRef(null)

  useEffect(() => {
    setMegaOpen(false)
    setServiceDropdownOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    const el = megaBtnRef.current
    if (!el) return
    const toggle = () => {
      setMegaOpen((prev) => !prev)
      setServiceDropdownOpen(false)
    }
    el.addEventListener('click', toggle)
    return () => el.removeEventListener('click', toggle)
  }, [])

  useEffect(() => {
    const t = megaTargetRef.current
    const b = megaBtnRef.current
    if (t) t.classList.toggle('is-active', megaOpen)
    if (b) b.classList.toggle('is-active', megaOpen)
  }, [megaOpen])

  useEffect(() => {
    const close = (e) => {
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(e.target)) {
        setServiceDropdownOpen(false)
      }
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  const isHome = location.pathname === '/'

  const headerClass = [megaOpen && 'header--mega-open', !isHome && 'header--has-logo'].filter(Boolean).join(' ')

  return (
    <header className={headerClass || undefined}>
      {!isHome && (
        <Link
          className="header-logo"
          to="/"
          aria-label="SETA Engineering"
          aria-hidden={megaOpen}
          tabIndex={megaOpen ? -1 : undefined}
        >
          <img src={ASSETS + 'header_logo.jpg'} alt="SETA Engineering" />
        </Link>
      )}
      <nav className="global-menu" id="js-global-menu">
        <ul className="global-menu__main">
          <li className="global-menu__item">
            <Link to="/">
              <span className="en">TOP</span>
              <span className="jp">{'\u30c8\u30c3\u30d7'}</span>
            </Link>
          </li>
          <li
            className="global-menu__item global-menu__item--has-dropdown"
            ref={serviceDropdownRef}
            onMouseEnter={() => setServiceDropdownOpen(true)}
            onMouseLeave={() => setServiceDropdownOpen(false)}
          >
            <button
              type="button"
              className="global-menu__service-trigger"
              onClick={() => setServiceDropdownOpen((prev) => !prev)}
              aria-expanded={serviceDropdownOpen}
              aria-haspopup="true"
              onKeyDown={(e) => {
                if (e.key === 'Escape') setServiceDropdownOpen(false)
              }}
            >
              <span className="en">Service</span>
              <span className="jp">{'\u4e8b\u696d\u7d39\u4ecb'}</span>
            </button>
            {serviceDropdownOpen && (
              <ul className="global-menu__dropdown" style={{ left: 0, right: 'auto' }}>
                {SERVICE_OPTIONS.map((opt) => (
                  <li key={opt.to}>
                    <Link
                      to={opt.to}
                      onClick={() => setServiceDropdownOpen(false)}
                    >
                      {opt.jp}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
          <li className="global-menu__item">
            <Link to="/achievements">
              <span className="en">Achievements</span>
              <span className="jp">{'\u5c0e\u5165\u4e8b\u4f8b\u30fb\u5b9f\u7e3e'}</span>
            </Link>
          </li>
          <li className="global-menu__item">
            <Link to="/news">
              <span className="en">News</span>
              <span className="jp">{'\u65b0\u7740\u60c5\u5831'}</span>
            </Link>
          </li>
          <li className="global-menu__item">
            <Link to="/company">
              <span className="en">Company</span>
              <span className="jp">{'\u4f01\u696d\u60c5\u5831'}</span>
            </Link>
          </li>
          <li className="global-menu__item">
            <Link to="/contact">
              <span className="en">Contact</span>
              <span className="jp">{'\u304a\u554f\u5408\u305b'}</span>
            </Link>
          </li>
        </ul>
        <button ref={megaBtnRef} type="button" className="btn-humburger" id="js-mega-menu__btn" aria-label="menu"><span /></button>
      </nav>
      <div ref={megaTargetRef} className="mega-menu-wrapper" id="js-mega-menu__target">
        <nav className="mega-menu pc">
          <div className="column--left">
            <h1 className="logo">
              <Link to="/"><img src={ASSETS + 'logo.png'} alt="SETA Engineering" style={{ width: 300, height: 135, display: 'block' }} /></Link>
            </h1>
            <div className="mega-menu__foot">
              <ul>
                <li><Link to="/contact">{'\u304a\u554f\u5408\u305b'}</Link></li>
                <li><Link to="/privacy-policy">{'\u500b\u4eba\u60c5\u5831\u4fdd\u8b77\u65b9\u91dd'}</Link></li>
              </ul>
              <div className="copyright">{'\u00a9'} 2026 SETA Engineering</div>
            </div>
          </div>
          <div className="column--right">
            <ul className="mega-menu__main">
              <li className="mega-menu__item mega-menu__item--service">
                <div className="mega-menu__service-row">
                  <div className="mega-menu__service-heading">
                    <span className="en mega-menu__service-heading__en">Service</span>
                    <span className="jp mega-menu__service-heading__jp">{'\u4e8b\u696d\u7d39\u4ecb'}</span>
                  </div>

                  <div className="mega-menu__service-sub">
                    <Link className="mega-menu__service-link" to="/recruitment">
                      <span className="mega-menu__service-link__text">
                        <span className="mega-menu__service-link__line">Global Recruitment & Talent Strategy Services</span>
                        <span className="mega-menu__service-link__line">{'\u30b0\u30ed\u30fc\u30d0\u30eb\u63a1\u7528\u30fb\u4eba\u6750\u6226\u7565\u652f\u63f4\u4e8b\u696d'}</span>
                      </span>
                    </Link>

                    <Link className="mega-menu__service-link" to="/recruitment/outsourcing">
                      <span className="mega-menu__service-link__text">
                        <span className="mega-menu__service-link__line">Technical Business Outsourcing Services</span>
                        <span className="mega-menu__service-link__line">{'\u6280\u8853\u696d\u52d9\u30a2\u30a6\u30c8\u30bd\u30fc\u30b7\u30f3\u30b0'}</span>
                      </span>
                    </Link>
                  </div>
                </div>
              </li>

              <li className="mega-menu__item">
                <Link to="/achievements" style={{ color: '#fff', textDecoration: 'none' }}>
                  <span className="en" style={{ display: 'block', opacity: 1, transform: 'none', transition: 'none', fontSize: 28, fontWeight: 500, lineHeight: '1em' }}>
                    Achievements
                  </span>
                  <span className="jp" style={{ display: 'block', position: 'static', opacity: 1, transform: 'none', transition: 'none', marginTop: 8, fontSize: 14, fontWeight: 400, lineHeight: 1.4 }}>
                    {'\u5c0e\u5165\u4e8b\u4f8b\u30fb\u5b9f\u7e3e'}
                  </span>
                </Link>
              </li>

              <li className="mega-menu__item">
                <Link to="/news" style={{ color: '#fff', textDecoration: 'none' }}>
                  <span className="en" style={{ display: 'block', opacity: 1, transform: 'none', transition: 'none', fontSize: 28, fontWeight: 500, lineHeight: '1em' }}>
                    News
                  </span>
                  <span className="jp" style={{ display: 'block', position: 'static', opacity: 1, transform: 'none', transition: 'none', marginTop: 8, fontSize: 14, fontWeight: 400, lineHeight: 1.4 }}>
                    {'\u65b0\u7740\u60c5\u5831'}
                  </span>
                </Link>
              </li>

              <li className="mega-menu__item">
                <Link to="/company" style={{ color: '#fff', textDecoration: 'none' }}>
                  <span className="en" style={{ display: 'block', opacity: 1, transform: 'none', transition: 'none', fontSize: 28, fontWeight: 500, lineHeight: '1em' }}>
                    Company
                  </span>
                  <span className="jp" style={{ display: 'block', position: 'static', opacity: 1, transform: 'none', transition: 'none', marginTop: 8, fontSize: 14, fontWeight: 400, lineHeight: 1.4 }}>
                    {'\u4f01\u696d\u60c5\u5831'}
                  </span>
                </Link>
              </li>

              <li className="mega-menu__item">
                <Link to="/contact" style={{ color: '#fff', textDecoration: 'none' }}>
                  <span className="en" style={{ display: 'block', opacity: 1, transform: 'none', transition: 'none', fontSize: 28, fontWeight: 500, lineHeight: '1em' }}>
                    Contact
                  </span>
                  <span className="jp" style={{ display: 'block', position: 'static', opacity: 1, transform: 'none', transition: 'none', marginTop: 8, fontSize: 14, fontWeight: 400, lineHeight: 1.4 }}>
                    {'\u304a\u554f\u5408\u305b'}
                  </span>
                </Link>
              </li>
            </ul>
          </div>
        </nav>
        <nav className="mobile-menu sp">
          <div className="mobile-menu__top">
            <h1 className="logo">
              <Link to="/">
                <img className="mobile-menu__logo-img" src={`${ASSETS}logo.png`} alt="SETA Engineering" width={260} height={78} decoding="async" />
              </Link>
            </h1>
          </div>
          <ul className="mobile-menu__main">
            <li className="mobile-menu__item">
              <Link to="/">
                <span className="en">TOP</span>
                <span className="jp">{'\u30c8\u30c3\u30d7'}</span>
              </Link>
            </li>
            <li className="mobile-menu__item">
              <Link to="/recruitment">
                <span className="en">Global Recruitment</span>
                <span className="jp">{'\u30b0\u30ed\u30fc\u30d0\u30eb\u63a1\u7528\u30fb\u4eba\u6750\u6226\u7565\u652f\u63f4\u4e8b\u696d'}</span>
              </Link>
            </li>
            <li className="mobile-menu__item">
              <Link to="/recruitment/outsourcing">
                <span className="en">Technical Outsourcing</span>
                <span className="jp">{'\u6280\u8853\u696d\u52d9\u30a2\u30a6\u30c8\u30bd\u30fc\u30b7\u30f3\u30b0'}</span>
              </Link>
            </li>
            <li className="mobile-menu__item">
              <Link to="/achievements">
                <span className="en">Achievements</span>
                <span className="jp">{'\u5c0e\u5165\u4e8b\u4f8b\u30fb\u5b9f\u7e3e'}</span>
              </Link>
            </li>
            <li className="mobile-menu__item">
              <Link to="/news">
                <span className="en">News</span>
                <span className="jp">{'\u65b0\u7740\u60c5\u5831'}</span>
              </Link>
            </li>
            <li className="mobile-menu__item">
              <Link to="/company">
                <span className="en">Company</span>
                <span className="jp">{'\u4f01\u696d\u60c5\u5831'}</span>
              </Link>
            </li>
            <li className="mobile-menu__item">
              <Link to="/contact">
                <span className="en">Contact</span>
                <span className="jp">{'\u304a\u554f\u5408\u305b'}</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
