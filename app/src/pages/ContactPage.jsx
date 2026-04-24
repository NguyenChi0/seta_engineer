import { useLayoutEffect, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HtmlContent from '../components/HtmlContent'
import { fetchHtmlCached } from '../utils/fetchHtmlCached'

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
const CONTENT = `${BASE}/content/contact.html`
const CSS = `${BASE}/assets/contact-page.css`

const SUBMIT_ACK_MESSAGE =
  'この度はお問い合わせいただき、誠にありがとうございます。\n内容を確認の上、担当者より早急にご連絡申し上げます。'

export default function ContactPage() {
  const [html, setHtml] = useState('')
  const [showSubmitAckModal, setShowSubmitAckModal] = useState(false)
  const [submitModalMessage, setSubmitModalMessage] = useState(SUBMIT_ACK_MESSAGE)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const containerRef = useRef(null)
  const navigate = useNavigate()

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

    const handleSubmit = async (e) => {
      const consent = form.querySelector('#contact-privacy-consent')
      const consentWrap = form.querySelector('.form__item--privacy-consent')
      if (consent && !consent.checked) {
        e.preventDefault()
        let err = form.querySelector('.privacy-consent-error')
        if (!err && consentWrap) {
          err = document.createElement('p')
          err.className = 'privacy-consent-error'
          err.setAttribute('role', 'alert')
          consentWrap.appendChild(err)
        }
        if (err) {
          err.textContent = '個人情報の取扱いにご同意のうえ、送信してください。'
        }
        consent?.focus()
        return
      }
      form.querySelector('.privacy-consent-error')?.remove()

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

      e.preventDefault()
      if (isSubmitting) return

      try {
        setIsSubmitting(true)
        form.querySelectorAll('input[name="subject_tmp[]"], input[name="subject_other_tmp"]').forEach((el) => {
          el.disabled = true
        })

        const action = form.getAttribute('action') || ''
        const method = (form.getAttribute('method') || 'POST').toUpperCase()
        await fetch(action, {
          method,
          mode: 'no-cors',
          body: new FormData(form),
        })

        setSubmitModalMessage(SUBMIT_ACK_MESSAGE)
        setShowSubmitAckModal(true)
      } catch {
        setSubmitModalMessage(SUBMIT_ACK_MESSAGE)
        setShowSubmitAckModal(true)
      } finally {
        setIsSubmitting(false)
      }
    }

    form.addEventListener('submit', handleSubmit)
    return () => {
      form.removeEventListener('submit', handleSubmit)
    }
  }, [html, isSubmitting])

  const closeSubmitAckModal = () => {
    setShowSubmitAckModal(false)
    navigate('/')
  }

  useLayoutEffect(() => {
    if (!showSubmitAckModal) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [showSubmitAckModal])

  return (
    <>
      <div ref={containerRef}>
        <HtmlContent html={html} />
      </div>
      {showSubmitAckModal ? (
        <div
          className="contact-submit-ack-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-submit-ack-heading"
        >
          <div className="contact-submit-ack-panel" onClick={(ev) => ev.stopPropagation()}>
            <p id="contact-submit-ack-heading" className="contact-submit-ack-message">
              {submitModalMessage}
            </p>
            <button type="button" className="contact-submit-ack-button" onClick={closeSubmitAckModal}>
              ホームページに戻る
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
