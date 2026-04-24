import { useLayoutEffect, useEffect, useState } from 'react'
import HtmlContent from '../components/HtmlContent'
import { fetchHtmlCached } from '../utils/fetchHtmlCached'

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
const CONTENT = `${BASE}/content/achievements.html`
const CSS = `${BASE}/assets/achievements-page.css`

export default function AchievementsPage() {
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
  }, [])

  return <HtmlContent html={html} />
}
