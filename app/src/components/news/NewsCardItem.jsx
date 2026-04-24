import { Link } from 'react-router-dom'

const ASSETS = (import.meta.env.BASE_URL || '/') + 'assets/'

const svgArrow = (
  <svg xmlns="http://www.w3.org/2000/svg" width="7.4961" height="7.064" viewBox="0 0 7.4961 7.064" aria-hidden>
    <path d="M6.0449,3.166L3.1904.6113l.4678-.6113,3.8379,3.5142v.0117l-3.8379,3.5381-.4678-.5996,2.8545-2.5664H0v-.7319h6.0449Z" strokeWidth="0" />
  </svg>
)

/**
 * @param {{ item: { href: string; category: string; categoryKey: string; date: string; datetime: string; title: string; excerpt: string; image: string } }} props
 */
export default function NewsCardItem({ item }) {
  const imageSrc =
    typeof item.image === 'string' &&
    (item.image.startsWith('http://') || item.image.startsWith('https://') || item.image.startsWith('/'))
      ? item.image
      : `${ASSETS}${item.image || ''}`

  return (
    <li className={`news-list__item category--${item.categoryKey}`}>
      <Link to={item.href} className="news-card">
        <div className="news-card__media">
          <img
            src={imageSrc}
            alt={item.title}
            width={800}
            height={600}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="news-card__body">
          <div className="news-card__meta">
            <span className="news__category">{item.category}</span>
            <time className="news__date" dateTime={item.datetime}>
              {item.date}
            </time>
          </div>
          <h3 className="news-card__title">{item.title}</h3>
          <p className="news-card__excerpt">{item.excerpt}</p>
          <div className="news-card__footer">
            <div className="btn-frame">
              <span className="btn-common btn-news btn-news--card" aria-hidden="true">
                <span className="btn__text">Read More</span>
                <span className="btn__icon">{svgArrow}</span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </li>
  )
}
