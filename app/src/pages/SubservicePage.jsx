import { useLayoutEffect, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import HtmlContent from '../components/HtmlContent'
import { fetchHtmlCached } from '../utils/fetchHtmlCached'

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')

export default function SubservicePage() {
  const { subserviceId } = useParams()
  const [html, setHtml] = useState('')

  useLayoutEffect(() => {
    const allowed = ['1-1', '1-2', '1-3', '1-4', '1-5', '2-1', '2-2', '2-3']
    const linkCommon = document.createElement('link')
    linkCommon.rel = 'stylesheet'
    linkCommon.href = `${BASE}/assets/service-page.css`
    document.head.appendChild(linkCommon)

    let linkSpecific = null
    if (subserviceId && allowed.includes(subserviceId)) {
      linkSpecific = document.createElement('link')
      linkSpecific.rel = 'stylesheet'
      linkSpecific.href = `${BASE}/assets/service-${subserviceId}.css`
      document.head.appendChild(linkSpecific)
    }

    return () => {
      linkCommon.remove()
      if (linkSpecific) linkSpecific.remove()
    }
  }, [subserviceId])

  useEffect(() => {
    const allowed = ['1-1', '1-2', '1-3', '1-4', '1-5', '2-1', '2-2', '2-3']
    if (!subserviceId || !allowed.includes(subserviceId)) {
      setHtml('<h1>Subservice not found</h1><p>指定されたサービスが存在しません。</p>')
      return
    }
    const contentUrl = `${BASE}/content/service-${subserviceId}.html`
    fetchHtmlCached(contentUrl)
      .then(setHtml)
      .catch(() => setHtml('<h1>Failed to load content.</h1><p>コンテンツを読み込めませんでした。</p>'))
  }, [subserviceId])

  return <HtmlContent html={html} />
}
