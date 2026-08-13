import { useLayoutEffect, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPostDetail } from '../api'
import { usePageMeta } from '../hooks/usePageMeta'
import { getPostHref } from '../utils/postUrl'
import { parsePostCategory } from '../utils/postCategory'
import { resolveApiAssetUrl, resolveApiAssetUrlsInHtml } from '../utils/assetUrl'

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
const CSS = `${BASE}/assets/news-detail-page.css`

function formatPostDate(iso) {
  const d = iso ? new Date(iso) : null
  if (!d || Number.isNaN(d.getTime())) {
    return ''
  }
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

export default function NewsDetailPage() {
  const { newsId } = useParams()
  const navigate = useNavigate()
  const contentRef = useRef(null)
  const [post, setPost] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useLayoutEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = CSS
    document.head.appendChild(link)
    return () => link.remove()
  }, [])

  useEffect(() => {
    const key = String(newsId || '').trim()
    if (!key) {
      setPost(null)
      setError('not-found')
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')

    getPostDetail(key)
      .then((res) => {
        if (cancelled) {
          return
        }
        if (!res?.post) {
          throw new Error('Not found')
        }
        setPost(res.post)
      })
      .catch(() => {
        if (!cancelled) {
          setPost(null)
          setError('load-failed')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [newsId])

  const contentHtml = useMemo(
    () => resolveApiAssetUrlsInHtml(String(post?.content || '')),
    [post?.content]
  )

  useEffect(() => {
    const el = contentRef.current
    if (!el || !contentHtml) return
    const links = el.querySelectorAll('a[href^="/"]')
    const handler = (e) => {
      const a = e.target.closest('a')
      if (!a || a.target === '_blank') return
      const href = a.getAttribute('href')
      if (href?.startsWith('/')) {
        e.preventDefault()
        navigate(href)
      }
    }
    links.forEach((a) => a.addEventListener('click', handler))
    return () => links.forEach((a) => a.removeEventListener('click', handler))
  }, [contentHtml, navigate])

  const metaTitle = post?.metaTitle?.trim() || post?.title || ''
  const metaDescription = post?.metaDescription?.trim() || post?.excerpt?.trim() || ''
  const ogImage = post?.titleImage ? resolveApiAssetUrl(post.titleImage) : ''

  usePageMeta({
    title: metaTitle,
    description: metaDescription,
    image: ogImage,
    url: post ? getPostHref(post) : `/news/${newsId || ''}`,
    type: 'article'
  })

  if (loading) {
    return (
      <main className="news-detail-page">
        <article className="news-article" aria-busy="true">
          <p className="news-article__loading">Loading...</p>
        </article>
      </main>
    )
  }

  if (error === 'not-found' || error === 'load-failed') {
    const message =
      error === 'not-found' ? 'お探しのページが見つかりません。' : '記事を読み込めませんでした。'
    return (
      <main className="news-detail-page">
        <article className="news-article">
          <h1 className="news-article__title">{message}</h1>
        </article>
      </main>
    )
  }

  const dateText = formatPostDate(post.createdAt)
  const { category: tag } = parsePostCategory(post.tags)

  return (
    <main className="news-detail-page">
      <article className="news-article">
        <div className="news-article__header">
          <h1 className="news-article__title">{post.title}</h1>
          <div className="news-article__meta">
            <span className="news-article__tag">{tag}</span>
            {dateText ? (
              <time className="news-article__created-time" dateTime={post.createdAt}>
                {dateText}
              </time>
            ) : null}
          </div>
        </div>

        {post.titleImage ? (
          <div className="news-article__hero">
            <img src={resolveApiAssetUrl(post.titleImage)} alt={post.title || ''} />
          </div>
        ) : null}

        <div
          ref={contentRef}
          className="news-article__content"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </article>
    </main>
  )
}
