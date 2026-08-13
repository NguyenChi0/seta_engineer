import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getLandingPage } from '../api'
import { usePageMeta } from '../hooks/usePageMeta'
import { prepareLandingShadowContent } from '../utils/landingHtml'
import { isReservedLandingSlug, getLandingHref } from '../utils/reservedSlugs'
import { resolveApiAssetUrlsInHtml } from '../utils/assetUrl'

const CSS = `${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/assets/custom-landing-page.css`

export default function CustomLandingPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const hostRef = useRef(null)
  const [page, setPage] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useLayoutEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = CSS
    document.head.appendChild(link)
    return () => link.remove()
  }, [])

  const normalizedSlug = String(slug || '').trim().toLowerCase()

  useEffect(() => {
    if (!normalizedSlug || isReservedLandingSlug(normalizedSlug)) {
      setPage(null)
      setError('not-found')
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')

    getLandingPage(normalizedSlug)
      .then((res) => {
        if (cancelled) return
        if (!res?.page) throw new Error('Not found')
        setPage(res.page)
      })
      .catch(() => {
        if (!cancelled) {
          setPage(null)
          setError('not-found')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [normalizedSlug])

  const shadowHtml = useMemo(() => {
    if (!page?.content) return ''
    const prepared = prepareLandingShadowContent(page.content)
    return resolveApiAssetUrlsInHtml(prepared)
  }, [page?.content])

  useEffect(() => {
    const host = hostRef.current
    if (!host || !shadowHtml) return

    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' })
    shadow.innerHTML = shadowHtml

    const onClick = (e) => {
      const a = e.target.closest('a')
      if (!a || a.target === '_blank') return
      const href = a.getAttribute('href')
      if (href?.startsWith('/') && !href.startsWith('//')) {
        e.preventDefault()
        navigate(href)
      }
    }
    shadow.addEventListener('click', onClick)
    return () => shadow.removeEventListener('click', onClick)
  }, [shadowHtml, navigate])

  const metaTitle = page?.metaTitle?.trim() || page?.title || ''
  const metaDescription = page?.metaDescription?.trim() || ''

  usePageMeta({
    title: metaTitle,
    description: metaDescription,
    url: getLandingHref(normalizedSlug),
    type: 'website'
  })

  if (loading) {
    return (
      <div className="custom-landing-page custom-landing-page--loading" aria-busy="true">
        Loading...
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="custom-landing-page custom-landing-page--error">
        <h1>お探しのページが見つかりません。</h1>
      </div>
    )
  }

  return <div ref={hostRef} className="custom-landing-page" />
}
