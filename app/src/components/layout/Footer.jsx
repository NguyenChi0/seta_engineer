import { useState } from 'react'
import { Link } from 'react-router-dom'

const ASSETS = (import.meta.env.BASE_URL || '/') + 'assets/'

function MapPinIcon({ size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 22s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function Footer() {
  const [serviceOpen, setServiceOpen] = useState(false)

  return (
    <footer style={{ backgroundColor: '#f5f5f5', color: '#000' }}>
      <div className="footer-container">
        <div className="column--left">
          <Link to="/">
            <img src={`${ASSETS}footer_logo.jpg`} alt="Seta Engineering" width="220" height="86" />
          </Link>
        </div>
        <div className="column--center">
          <dl>
            <dt>Tokyo Office（本社）</dt>
            <dd>
              <span>
                東京都世田谷区北沢三丁目2番1号<br />
                レガーロ東北沢B1 Zcircle下北沢4F-07
              </span>
              <div>
                <a
                  href="https://maps.app.goo.gl/zoac5HGin9dpSJe17"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    textDecoration: 'underline',
                    textDecorationColor: '#ca1d1d',
                    textUnderlineOffset: 3,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#ca1d1d',
                  }}
                >
                  <MapPinIcon /> MAP
                </a>
              </div>
            </dd>
            <dt>Vietnam Office</dt>
            <dd>
              <span>3F, 82 Tue Tinh, Hai Ba Trung, Hanoi</span>
              <div>
                <a
                  href="https://maps.app.goo.gl/FL8eshCZvSSf7SQs7"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    textDecoration: 'underline',
                    textDecorationColor: '#ca1d1d',
                    textUnderlineOffset: 3,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#ca1d1d',
                  }}
                >
                  <MapPinIcon /> MAP
                </a>
              </div>
            </dd>
          </dl>
        </div>
        <div className="column--right">
          <nav className="footer-menu">
            <ul className="footer-menu__main">
              <li className="footer-menu__item footer-menu__item--service">
                <button
                  type="button"
                  id="footer-service-toggle"
                  className={`footer-menu__service-toggle${serviceOpen ? ' is-active' : ''}`}
                  aria-expanded={serviceOpen}
                  aria-controls="footer-service-sub"
                  onClick={() => setServiceOpen((o) => !o)}
                >
                  <span className="footer-menu__service-lines">
                    <span>事業紹介</span>
                    <span className="en">Service</span>
                  </span>
                </button>
                <ul
                  id="footer-service-sub"
                  className={`footer-menu__sub footer-menu__sub--service${serviceOpen ? ' is-open' : ''}`}
                >
                  <li>
                    <Link to="/recruitment" onClick={() => setServiceOpen(false)} style={{ color: '#000' }}>
                      グローバル採用・人材戦略支援事業
                    </Link>
                  </li>
                  <li>
                    <Link to="/recruitment/outsourcing" onClick={() => setServiceOpen(false)} style={{ color: '#000' }}>
                      技術業務アウトソーシング
                    </Link>
                  </li>
                </ul>
              </li>
              <li className="footer-menu__item">
                <Link to="/achievements" style={{ color: '#000' }}><h3><span>導入事例・実績紹介</span><span className="en">Achievement</span></h3></Link>
                <Link to="/news" style={{ color: '#000' }}><h3><span>新着情報</span><span className="en">News</span></h3></Link>
                <Link to="/company" style={{ color: '#000' }}><h3><span>企業情報</span><span className="en">Company</span></h3></Link>
                <Link to="/privacy-policy" style={{ color: '#000' }}><h3><span>個人情報保護方針</span><span className="en">Privacy policy</span></h3></Link>
                <Link to="/contact" style={{ color: '#000' }}><h3><span>お問い合わせ</span><span className="en">Contact</span></h3></Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
      <div className="copyright" style={{ background: '#ca1d1d', color: '#fff' }}>© 2026 Seta Engineering</div>
    </footer>
  )
}
