import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRevealInViewport } from '../hooks/useRevealInViewport'
import { HOME_NEWS_PREVIEW_COUNT } from '../data/newsItems'
import { getPosts } from '../api'

const ASSETS = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') + 'assets/'

const svgArrow = (
  <svg xmlns="http://www.w3.org/2000/svg" width="7.4961" height="7.064" viewBox="0 0 7.4961 7.064">
    <path d="M6.0449,3.166L3.1904.6113l.4678-.6113,3.8379,3.5142v.0117l-3.8379,3.5381-.4678-.5996,2.8545-2.5664H0v-.7319h6.0449Z" strokeWidth="0" />
  </svg>
)

function KeyVisual() {
  const pcVideoRef = useRef(null)
  const spVideoRef = useRef(null)

  useEffect(() => {
    pcVideoRef.current?.play().catch(() => {})
    spVideoRef.current?.play().catch(() => {})
  }, [])

  return (
    <div className="keyvisual">
      <div className="pc">
        <video
          ref={pcVideoRef}
          src={`${ASSETS}home_page_vid_2.mp4`}
          autoPlay
          muted
          playsInline
          onEnded={(e) => e.target.pause()}
          style={{ width: '100%', height: '100%', aspectRatio: '1.92 / 1', objectFit: 'cover', transform: 'scale(1.002)' }}
        />
      </div>
      <div className="sp">
        <img src={`${ASSETS}kv_movie_sp.jpg`} alt="Seta Engineering" fetchPriority="high" />
        <video
          ref={spVideoRef}
          src={`${ASSETS}homevid_mobile.mp4`}
          autoPlay
          muted
          playsInline
          loop={false}
          onEnded={(e) => e.target.pause()}
          style={{ position: 'relative', width: '100%', transform: 'scale(1.002)' }}
        />
      </div>
    </div>
  )
}

function Mission() {
  const { ref, isRevealed } = useRevealInViewport()
  return (
    <section ref={ref} className={`top-section top-section01${isRevealed ? ' in-viewport' : ''}`} id="mission">
      <div className="container">
        <div className="section__header">
          <h2>
            <span className="en">
              <span>
                Our <br className="sp" />
                Mission
              </span>
            </span>
            <span className="jp">私たちのミッション</span>
          </h2>
        </div>
        <div className="section__body">
          <p>
            私たちは、「人材 × 技術 × 現場力」を軸に、企業とエンジニア、そして現場を確実につなぐパートナーとして、日本のものづくり・技術現場を支えています。<br />
            <br />
            私たちは、単なる人材紹介や外注先ではありません。企業ごとの課題や業務内容に向き合い、ご依頼ごとに最適な体制を設計し、採用から設計・開発・運用までを一貫して支援します。<br className="pc" />
            <br className="pc" />
            成果から逆算した実行力と、現場を理解した実務視点をもとに、「安心して任せられる」「長く付き合える」存在であることを大切にし、プロジェクト終了後も企業の力として残り続ける、本質的な価値を提供します。
          </p>
        </div>
      </div>
    </section>
  )
}

const HOME_SERVICES = [
  {
    to: '/recruitment',
    jp: 'グローバル採用・人材戦略支援事業',
    en: 'Global Recruitment &\nTalent Strategy Services',
  },
  {
    to: '/recruitment/outsourcing',
    jp: '技術業務アウトソーシング',
    en: 'Technical Outsourcing Services',
  },
]

function Service() {
  const { ref, isRevealed } = useRevealInViewport()
  useEffect(() => {
    const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `${BASE}/assets/home-service-page.css`
    document.head.appendChild(link)
    return () => link.remove()
  }, [])

  return (
    <section
      ref={ref}
      className={`top-section top-section02 home-service-section${isRevealed ? ' in-viewport' : ''}`}
      id="service"
    >
      <div className="container">
        <div className="section__header">
          <h2>
            <span className="en">
              <span>Service</span>
            </span>
            <span className="jp">事業紹介</span>
          </h2>
        </div>
        <div className="section__body">
          <p>
            人材採用から、設計・開発・運用まで、企業の成長に必要な業務領域を多角的に支援。<br />
            単なる紹介や委託ではなく、採用戦略の設計、業務プロセスの構築、技術人材のアサイン、教育支援、マーケティングまで、現場視点でのワンストップソリューションを提供します。<br className="pc" />
            <br className="pc" />
            私たちは、これまでの100社以上の支援実績に基づき、本当に機能するアウトソーシングと、プロジェクト型支援体制で、貴社の事業成長をサポートします。
          </p>
          <div className="service-cards-wrapper">
            <ul className="service-cards">
              {HOME_SERVICES.map((s, i) => (
                <li key={i} className="service-card">
                  <Link to={s.to}>
                    <span className="shown-text">
                      <span className="service-card__en">{s.en}</span>
                      <span className="service-card__jp">{s.jp}</span>
                    </span>
                    <span className="btn-read-more">
                      <span className="btn__text">Read more {'>>'}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

function IntegratedBusinessModel() {
  const { ref, isRevealed } = useRevealInViewport()
  return (
    <div
      ref={ref}
      className={`top-section top-section-integrated${isRevealed ? ' in-viewport' : ''}`}
      id="integrated-business-model"
    >
      <div className="container">
        <div className="section__header">
          <h2>
            <span className="en">
              <span>Integrated Engineering Business Model</span>
            </span>
            <span className="jp">日越連携による統合型エンジニアリングビジネスモデル</span>
          </h2>
        </div>
        <div className="section__body">
          <p>
            Seta EngineeringとWorkstation Vietnamは、単なる業務提携ではなく、日越それぞれの機能を統合した新しいビジネスモデルを構築しています。
            <br />
            <br />
            ベトナム側の人材基盤・教育・実務支援と、日本側の顧客対応・契約・運用支援を一体化することで、採用から実務運用までを一貫して提供できる体制を実現しています。
          </p>
          <div className="integrated-model-columns">
            <div className="integrated-model-card">
              <h3 className="integrated-model-card__title">Workstation Vietnam</h3>
              <p className="integrated-model-card__subtitle">Talent &amp; Delivery Base (Vietnam)</p>
              <p className="integrated-model-card__text">
                人材発掘・教育・日本語研修・設計実務支援を担い、安定した人材供給と実務対応を支える基盤として機能します。
              </p>
            </div>
            <div className="integrated-model-columns__arrow" aria-hidden="true">
              <img src={`${ASSETS}arrow.png`} alt="" />
            </div>
            <div className="integrated-model-card">
              <h3 className="integrated-model-card__title">Seta Engineering</h3>
              <p className="integrated-model-card__subtitle">Client Interface &amp; Project Management (Japan)</p>
              <p className="integrated-model-card__text">
                日本国内の窓口として、顧客対応・提案・契約・プロジェクト設計・運用支援を担当し、企業ごとの課題に応じた最適な体制を構築します。
              </p>
            </div>
          </div>
          <p className="integrated-model-summary">
            日越一体のビジネスモデルにより、採用から実務運用までを一貫して
            <br className="pc" />
            支援し、企業の成長を支える持続的なソリューションを提供します。
          </p>
          <div className="btn-container integrated-model-readmore">
            <div className="btn-frame">
              <Link to="/setax-ws" className="btn-common">
                <span className="btn__text">Read More</span>
                <span className="btn__icon">{svgArrow}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Achievements() {
  const { ref, isRevealed } = useRevealInViewport()
  return (
    <section ref={ref} className={`top-section top-section03${isRevealed ? ' in-viewport' : ''}`} id="achievements">
      <div className="container">
        <div className="section__header">
          <h2>
            <span className="en">
              <span>Achievements</span>
            </span>
            <span className="jp">導入事例・事績紹介</span>
          </h2>
        </div>
        <div className="section__body">
          <p>
            Seta Engineeringでは、ベトナムを中心に20校以上の大学と産学連携を行い、500名以上の若手エンジニア育成に取り組んできました。これまでに1000名以上の外国人技術者の就職支援実績を積み上げ、現地教育から日本就職までを一貫して支援できる体制を構築しています。<br className="pc" />
            <br className="pc" />
            この確かな基盤を活かし、現在ではプロジェクト型アウトソーシングやリモート開発チームの構築、さらには日本語人材の紹介・研修サービスなど、多岐にわたるサービス展開を通じて、企業の中長期的な成長に寄与しています。<br className="pc" />
            <br className="pc" />
            私たちは、単なる人材の供給にとどまらず、「安心して任せられる体制」と「成果へのコミット」を軸に、企業の挑戦に並走し続けています。
          </p>
          <div className="btn-container">
            <div className="btn-frame">
              <Link to="/achievements" className="btn-common">
                <span className="btn__text">Read More</span>
                <span className="btn__icon">{svgArrow}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function NewsSection() {
  const { ref, isRevealed } = useRevealInViewport()
  const [preview, setPreview] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await getPosts({ limit: HOME_NEWS_PREVIEW_COUNT })
        if (!cancelled) {
          setPreview(res.posts || [])
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Newsの読み込みに失敗しました。')
          setPreview([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const formatDate = (iso) => {
    if (!iso) {
      return '—'
    }
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) {
      return '—'
    }
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
  }

  return (
    <section ref={ref} className={`top-section top-section04${isRevealed ? ' in-viewport' : ''}`} id="news">
      <div className="container">
        <div className="section__header">
          <h2>
            <span className="en">
              <span>News</span>
            </span>
            <span className="jp">新着情報</span>
          </h2>
        </div>
        <div className="section__body">
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <ul className="news-list">
              {preview.map((item, i) => (
                <li key={item.id ?? i} className="news-list__item category--info">
                  <Link to={`/news/${item.id}`}>
                    <time className="news__date" dateTime={item.createdAt || ''}>
                      {formatDate(item.createdAt)}
                    </time>
                    <div className="news__category">{item.tags || 'お知らせ'}</div>
                    <div className="news__content">
                      <div className="news__title">
                        <p>{item.title}</p>
                      </div>
                      <div className="btn-frame">
                        <div className="btn-common btn-news">
                          <span className="btn__text">Read More</span>
                          <span className="btn__icon">{svgArrow}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="btn-container">
            <div className="btn-frame">
              <Link to="/news" className="btn-common">
                <span className="btn__text">View All</span>
                <span className="btn__icon">{svgArrow}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <>
      <KeyVisual />
      <Mission />
      <Service />
      <IntegratedBusinessModel />
      <Achievements />
      <NewsSection />
    </>
  )
}
