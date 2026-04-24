import { useLayoutEffect, useEffect, useState } from 'react'
import HtmlContent from '../components/HtmlContent'
import { fetchHtmlCached } from '../utils/fetchHtmlCached'

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
const CONTENT = `${BASE}/content/setax-ws.html`
const CSS = `${BASE}/assets/news-detail-page.css`

export default function SetaxWs() {
  const [html, setHtml] = useState('')

  useLayoutEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = CSS
    document.head.appendChild(link)
    return () => link.remove()
  }, [])

  useEffect(() => {
    fetchHtmlCached(CONTENT)
      .then(setHtml)
      .catch(() => {
        setHtml(
          '<div class="news-detail-page"><div class="news-article">' +
            '<h1 class="news-article__title">コンテンツを読み込めませんでした。</h1>' +
            '</div></div>',
        )
      })
  }, [])

  return <HtmlContent html={html} />
}
