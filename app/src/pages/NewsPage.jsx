import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import NewsCardItem from '../components/news/NewsCardItem'
import { getPosts } from '../api'

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
const CSS = `${BASE}/assets/top.css`

export default function NewsPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useLayoutEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = CSS
    document.head.appendChild(link)
    return () => link.remove()
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await getPosts()
        if (!cancelled) {
          setPosts(res.posts || [])
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || '記事を読み込めませんでした。')
          setPosts([])
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

  const items = useMemo(
    () =>
      posts.map((post) => {
        const d = post.createdAt ? new Date(post.createdAt) : null
        const isValid = d && !Number.isNaN(d.getTime())
        const yyyy = isValid ? d.getFullYear() : '----'
        const mm = isValid ? String(d.getMonth() + 1).padStart(2, '0') : '--'
        const dd = isValid ? String(d.getDate()).padStart(2, '0') : '--'
        return {
          id: String(post.id),
          href: `/news/${post.id}`,
          category: post.tags || 'お知らせ',
          categoryKey: 'info',
          date: `${yyyy}/${mm}/${dd}`,
          datetime: isValid ? d.toISOString().slice(0, 10) : '',
          title: post.title || '',
          excerpt: post.excerpt || '',
          image: post.titleImage || ''
        }
      }),
    [posts]
  )

  return (
    <main className="news-page page-hero-marquee">
      <div className="page-title">
        <div className="marquee">
          <div className="marquee-track">
            <div className="marquee-inner">News News</div>
            <div className="marquee-inner">News News</div>
          </div>
        </div>
        <div className="page-title__main">
          <h1>新着情報</h1>
        </div>
      </div>

      <article className="news">
        <section className="page-section in-viewport">
          <div className="container">
            <div className="section__header">
              <h2>
                <span className="en">News</span>
                <span className="jp">新着情報</span>
              </h2>
            </div>

            <div className="section__body">
              {loading ? <p>Loading...</p> : null}
              {error ? <p>{error}</p> : null}
              {!loading && !error ? (
                <ul className="news-list news-list--cards">
                  {items.map((item) => (
                    <NewsCardItem key={item.id} item={item} />
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </section>
      </article>
    </main>
  )
}
