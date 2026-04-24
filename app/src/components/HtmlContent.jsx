import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function HtmlContent({ html }) {
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!ref.current || !html) return
    const el = ref.current
    const links = el.querySelectorAll('a[href^="/"]')
    const handler = (e) => {
      const a = e.target.closest('a')
      if (!a || a.target === '_blank') return
      const href = a.getAttribute('href')
      if (href && href.startsWith('/')) {
        e.preventDefault()
        navigate(href)
      }
    }
    links.forEach((a) => a.addEventListener('click', handler))
    return () => links.forEach((a) => a.removeEventListener('click', handler))
  }, [html, navigate])

  if (!html) {
    return (
      <div
        className="page-html-content page-html-content--loading"
        aria-busy="true"
        aria-live="polite"
      />
    )
  }
  return <div ref={ref} className="page-html-content" dangerouslySetInnerHTML={{ __html: html }} />
}
