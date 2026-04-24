import { useLayoutEffect, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import HtmlContent from '../components/HtmlContent'
import { getPostDetail } from '../api'

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
const CSS = `${BASE}/assets/news-detail-page.css`

export default function NewsDetailPage() {
  const { newsId } = useParams()
  const [html, setHtml] = useState('')

  useLayoutEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = CSS
    document.head.appendChild(link)
    return () => link.remove()
  }, [])

  useEffect(() => {
    const id = Number(newsId)
    if (!Number.isInteger(id) || id < 1) {
      setHtml(
        '<main class="news-detail-page"><article class="news-article">' +
          '<h1 class="news-article__title">お探しのページが見つかりません。</h1>' +
          '</article></main>',
      )
      return
    }

    getPostDetail(id)
      .then((res) => {
        const post = res?.post
        if (!post) {
          throw new Error('Not found')
        }
        const createdDate = post.createdAt ? new Date(post.createdAt) : null
        const dateText =
          createdDate && !Number.isNaN(createdDate.getTime())
            ? `${createdDate.getFullYear()}/${String(createdDate.getMonth() + 1).padStart(2, '0')}/${String(
                createdDate.getDate()
              ).padStart(2, '0')}`
            : ''
        const imageHtml = post.titleImage
          ? `<div class="news-article__hero"><img src="${String(post.titleImage)}" alt="${String(post.title || '')}" /></div>`
          : ''
        const htmlDoc =
          '<main class="news-detail-page"><article class="news-article">' +
          `<h1 class="news-article__title" style="text-align:center;">${String(post.title || '')}</h1>` +
          '<div class="news-article__meta" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;margin:0 auto 22px;">' +
          `<span class="news-article__tag" style="display:inline-flex;align-items:center;justify-content:center;padding:6px 14px;border-radius:999px;background:#d82323;color:#fff;font-size:13px;font-weight:700;line-height:1;">${String(post.tags || 'お知らせ')}</span>` +
          `<time class="news-article__created-time" style="font-size:14px;color:#6b7280;line-height:1.2;text-align:center;">${dateText}</time>` +
          '</div>' +
          imageHtml +
          `<div class="news-article__content">${String(post.content || '')}</div>` +
          '</article></main>'
        setHtml(htmlDoc)
      })
      .catch(() => {
        setHtml(
          '<main class="news-detail-page"><article class="news-article">' +
            '<h1 class="news-article__title">記事を読み込めませんでした。</h1>' +
            '</article></main>',
        )
      })
  }, [newsId])

  return <HtmlContent html={html} />
}
