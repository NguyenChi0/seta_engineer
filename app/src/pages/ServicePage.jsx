import { useLayoutEffect, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import HtmlContent from '../components/HtmlContent'
import { fetchHtmlCached } from '../utils/fetchHtmlCached'

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
const CSS = `${BASE}/assets/service-page.css`

export default function ServicePage() {
  const { pathname } = useLocation()
  const isOutsourcing = pathname === '/recruitment/outsourcing' || pathname.endsWith('/recruitment/outsourcing')
  const CONTENT = `${BASE}/content/${isOutsourcing ? 'service-outsourcing' : 'service'}.html`
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
      .catch(() => setHtml('<p>Failed to load content.</p>'))
  }, [CONTENT])

  return <HtmlContent html={html} />
}
