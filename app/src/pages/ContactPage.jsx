import { useLayoutEffect, useEffect, useRef, useState } from 'react'
import HtmlContent from '../components/HtmlContent'
import { fetchHtmlCached } from '../utils/fetchHtmlCached'

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
const CONTENT = `${BASE}/content/contact.html`
const CSS = `${BASE}/assets/contact-page.css`

export default function ContactPage() {
  const [html, setHtml] = useState('')
  const containerRef = useRef(null)

  useLayoutEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = CSS
    document.head.appendChild(link)
    return () => link.remove()
  }, [])

  useEffect(() => {
    fetchHtmlCached(CONTENT)
      .then((text) => {
        const base = import.meta.env.BASE_URL || '/'
        const nextUrl = new URL('contact?sent=1', window.location.origin + base).href
        setHtml(text.replaceAll('__CONTACT_FORM_NEXT__', nextUrl))
      })
      .catch(() => setHtml('<p>Failed to load content.</p>'))
  }, [])

  useEffect(() => {
    if (!html || !containerRef.current) return undefined

    const form = containerRef.current.querySelector('.wpcf7-form')
    if (!form) return undefined

    const handleSubmit = () => {
      const selected = Array.from(form.querySelectorAll('input[name="subject_tmp[]"]:checked')).map(
        (el) => el.value,
      )
      const otherInput = form.querySelector('input[name="subject_other_tmp"]')
      const otherText = otherInput ? otherInput.value.trim() : ''
      const subject = selected
        .map((item) => {
          if (item === 'その他' && otherText) return `その他 : ${otherText}`
          return item
        })
        .join(' / ')

      const hiddenSubject = form.querySelector('#mail-subject-hidden')
      if (hiddenSubject) hiddenSubject.value = subject

      form.querySelectorAll('input[name="subject_tmp[]"], input[name="subject_other_tmp"]').forEach((el) => {
        el.disabled = true
      })
    }

    form.addEventListener('submit', handleSubmit)
    return () => {
      form.removeEventListener('submit', handleSubmit)
    }
  }, [html])

  return (
    <div ref={containerRef}>
      <HtmlContent html={html} />
    </div>
  )
}
