import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { getAdminMedia, patchAdminMedia } from '../../api'
import { resolveApiAssetUrl } from '../../utils/assetUrl'
import { buildImageTag } from '../../utils/imageHtml'
import './mediaLibrary.css'

/**
 * @param {{
 *   open: boolean
 *   onClose: () => void
 *   kind?: 'content' | 'title' | 'all'
 *   onSelect?: (item: { url: string, altText: string, titleAttr: string, caption: string }) => void
 *   selectLabel?: string
 * }} props
 */
export default function MediaLibraryModal({
  open,
  onClose,
  kind = 'content',
  onSelect,
  selectLabel = 'Chèn vào bài',
  onApplyToContent
}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [draft, setDraft] = useState({ altText: '', titleAttr: '', caption: '' })
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAdminMedia({ kind })
      setItems(res.items || [])
    } catch (e) {
      setError(e?.message || 'Không tải được thư viện media')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [kind])

  useEffect(() => {
    if (!open) {
      return
    }
    loadItems()
    setSelectedId(null)
    setDraft({ altText: '', titleAttr: '', caption: '' })
    setSaveMessage('')
  }, [open, loadItems])

  useEffect(() => {
    if (!open) {
      return
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) || null,
    [items, selectedId]
  )

  useEffect(() => {
    if (!selected) {
      setDraft({ altText: '', titleAttr: '', caption: '' })
      return
    }
    setDraft({
      altText: selected.altText || '',
      titleAttr: selected.titleAttr || '',
      caption: selected.caption || ''
    })
    setSaveMessage('')
  }, [selected])

  const handleSelectItem = (item) => {
    setSelectedId(item.id)
  }

  const handleSaveSeo = async () => {
    if (!selected) {
      return
    }
    setSaving(true)
    setSaveMessage('')
    try {
      const res = await patchAdminMedia(selected.id, draft)
      const updated = res.item
      setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
      setSaveMessage('Đã lưu thuộc tính SEO.')
    } catch (e) {
      setSaveMessage(e?.message || 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleInsert = () => {
    if (!selected || !onSelect) {
      return
    }
    onSelect({
      url: selected.url,
      altText: draft.altText || selected.altText || '',
      titleAttr: draft.titleAttr || selected.titleAttr || '',
      caption: draft.caption || selected.caption || ''
    })
    onClose()
  }

  const handleApplyToContent = () => {
    if (!selected || !onApplyToContent) {
      return
    }
    onApplyToContent({
      url: selected.url,
      altText: draft.altText,
      titleAttr: draft.titleAttr,
      caption: draft.caption
    })
    setSaveMessage('Đã áp dụng alt/title vào thẻ img trong nội dung.')
  }

  if (!open) {
    return null
  }

  return createPortal(
    <div className="media-library" role="dialog" aria-modal="true" aria-label="Thư viện media">
      <button type="button" className="media-library__backdrop" onClick={onClose} aria-label="Đóng" />
      <div className="media-library__panel">
        <div className="media-library__header">
          <div>
            <h3 className="media-library__title">Thư viện media</h3>
            <p className="media-library__subtitle">Chọn ảnh đã upload, chỉnh alt/title cho SEO</p>
          </div>
          <button type="button" className="media-library__close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="media-library__body">
          <div className="media-library__grid-wrap">
            {loading ? <p className="media-library__hint">Đang tải…</p> : null}
            {error ? <p className="media-library__error">{error}</p> : null}
            {!loading && !error && items.length === 0 ? (
              <p className="media-library__hint">Chưa có media. Upload ảnh trước.</p>
            ) : null}
            <div className="media-library__grid">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`media-library__thumb${selectedId === item.id ? ' media-library__thumb--active' : ''}`}
                  onClick={() => handleSelectItem(item)}
                >
                  <img src={resolveApiAssetUrl(item.url)} alt={item.altText || item.filename} loading="lazy" />
                  <span className="media-library__thumb-kind">{item.kind === 'title' ? 'Đại diện' : 'Nội dung'}</span>
                </button>
              ))}
            </div>
          </div>

          <aside className="media-library__detail">
            {selected ? (
              <>
                <div className="media-library__preview">
                  <img src={resolveApiAssetUrl(selected.url)} alt={draft.altText || selected.filename} />
                </div>
                <p className="media-library__url">{selected.url}</p>

                <label className="media-library__label" htmlFor="media-alt">
                  Alt text (SEO / accessibility)
                </label>
                <input
                  id="media-alt"
                  className="media-library__input"
                  value={draft.altText}
                  onChange={(e) => setDraft((d) => ({ ...d, altText: e.target.value }))}
                  placeholder="Mô tả ngắn nội dung ảnh"
                />

                <label className="media-library__label" htmlFor="media-title">
                  Title attribute
                </label>
                <input
                  id="media-title"
                  className="media-library__input"
                  value={draft.titleAttr}
                  onChange={(e) => setDraft((d) => ({ ...d, titleAttr: e.target.value }))}
                  placeholder="Tooltip / bổ sung SEO"
                />

                <label className="media-library__label" htmlFor="media-caption">
                  Caption (tham khảo nội bộ)
                </label>
                <textarea
                  id="media-caption"
                  className="media-library__textarea"
                  value={draft.caption}
                  onChange={(e) => setDraft((d) => ({ ...d, caption: e.target.value }))}
                  placeholder="Ghi chú caption — không tự chèn vào thẻ img"
                  rows={3}
                />

                <div className="media-library__actions">
                  <button
                    type="button"
                    className="media-library__btn media-library__btn--primary"
                    onClick={handleSaveSeo}
                    disabled={saving}
                  >
                    {saving ? 'Đang lưu…' : 'Lưu SEO'}
                  </button>
                  {onSelect ? (
                    <button type="button" className="media-library__btn" onClick={handleInsert}>
                      {selectLabel}
                    </button>
                  ) : null}
                  {onApplyToContent ? (
                    <button type="button" className="media-library__btn" onClick={handleApplyToContent}>
                      Áp dụng SEO vào bài
                    </button>
                  ) : null}
                </div>
                {saveMessage ? <p className="media-library__message">{saveMessage}</p> : null}
                <p className="media-library__hint">
                  Preview thẻ chèn:{' '}
                  <code>{buildImageTag(selected.url, { alt: draft.altText, title: draft.titleAttr })}</code>
                </p>
              </>
            ) : (
              <p className="media-library__hint">Chọn một ảnh để xem và chỉnh thuộc tính SEO.</p>
            )}
          </aside>
        </div>
      </div>
    </div>,
    document.body
  )
}
