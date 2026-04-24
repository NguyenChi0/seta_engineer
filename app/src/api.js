import { getAdminToken } from './admin/adminAuth'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

function buildUrl(path) {
  return `${API_BASE_URL}${path}`
}

/** Parse JSON body; nếu proxy/Express trả HTML 500, vẫn đọc được mô tả hữu ích. */
async function readResponseBodyAsJsonOrHint(response) {
  const text = await response.text()
  if (!text) {
    return { message: `${response.status} ${response.statusText}` }
  }
  try {
    return JSON.parse(text)
  } catch {
    const firstLine = text.trim().split('\n')[0].slice(0, 200)
    return { message: firstLine || 'Loi may chu' }
  }
}

export async function sendContactForm(payload) {
  const response = await fetch(buildUrl('/api/contact'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const message = data?.message || 'Khong gui duoc form lien he.'
    throw new Error(message)
  }

  return data
}

export async function getPosts({ q, limit, offset } = {}) {
  const p = new URLSearchParams()
  if (q != null && String(q).trim()) {
    p.set('q', String(q).trim())
  }
  if (Number.isInteger(limit) && limit > 0) {
    p.set('limit', String(limit))
  }
  if (Number.isInteger(offset) && offset >= 0) {
    p.set('offset', String(offset))
  }
  const qs = p.toString() ? `?${p.toString()}` : ''
  const response = await fetch(buildUrl(`/api/posts${qs}`), { method: 'GET' })
  const data = await readResponseBodyAsJsonOrHint(response)
  if (!response.ok) {
    const detail = [data?.message, data?.code && `(${data.code})`].filter(Boolean).join(' ').trim()
    throw new Error(detail || `Loi ${response.status}`)
  }
  return data
}

export async function getPostDetail(id) {
  const response = await fetch(buildUrl(`/api/posts/${id}`), { method: 'GET' })
  const data = await readResponseBodyAsJsonOrHint(response)
  if (!response.ok) {
    const detail = [data?.message, data?.code && `(${data.code})`].filter(Boolean).join(' ').trim()
    throw new Error(detail || `Loi ${response.status}`)
  }
  return data
}

export async function postAdminLogin(payload) {
  const response = await fetch(buildUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  const data = await readResponseBodyAsJsonOrHint(response)
  if (!response.ok) {
    const detail = [data?.message, data?.code && `(${data.code})`].filter(Boolean).join(' ').trim()
    throw new Error(detail || `Dang nhap that bai (${response.status})`)
  }
  return data
}

export async function getAdminMe(token) {
  const response = await fetch(buildUrl('/api/auth/me'), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  const data = await readResponseBodyAsJsonOrHint(response)
  if (!response.ok) {
    const detail = [data?.message, data?.code && `(${data.code})`].filter(Boolean).join(' ').trim()
    throw new Error(detail || `Xac thuc that bai (${response.status})`)
  }
  return data
}

async function apiFetchWithAuth(path, init = {}) {
  const token = getAdminToken()
  if (!token) {
    throw new Error('Chua dang nhap')
  }
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData
  const headers = {
    Authorization: `Bearer ${token}`,
    ...(init.body != null && !isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...init.headers
  }
  const response = await fetch(buildUrl(path), { ...init, headers })
  const data = await readResponseBodyAsJsonOrHint(response)
  if (!response.ok) {
    const detail = [data?.message, data?.code && `(${data.code})`].filter(Boolean).join(' ').trim()
    throw new Error(detail || `Loi ${response.status}`)
  }
  return data
}

export async function getAdminUsers({ q, status } = {}) {
  const p = new URLSearchParams()
  if (q != null && String(q).trim()) {
    p.set('q', String(q).trim())
  }
  if (status === 0 || status === '0') {
    p.set('status', '0')
  } else {
    p.set('status', '1')
  }
  const qs = p.toString() ? `?${p.toString()}` : ''
  return apiFetchWithAuth(`/api/admin/users${qs}`, { method: 'GET' })
}

export async function postAdminUser(payload) {
  return apiFetchWithAuth('/api/admin/users', { method: 'POST', body: JSON.stringify(payload) })
}

export async function patchAdminUser(id, payload) {
  return apiFetchWithAuth(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function deleteAdminUser(id) {
  return apiFetchWithAuth(`/api/admin/users/${id}`, { method: 'DELETE' })
}

export async function getAdminPosts({ q } = {}) {
  const p = new URLSearchParams()
  if (q != null && String(q).trim()) {
    p.set('q', String(q).trim())
  }
  const qs = p.toString() ? `?${p.toString()}` : ''
  return apiFetchWithAuth(`/api/admin/posts${qs}`, { method: 'GET' })
}

export async function getAdminPost(id) {
  return apiFetchWithAuth(`/api/admin/posts/${id}`, { method: 'GET' })
}

export async function postAdminPost(payload) {
  return apiFetchWithAuth('/api/admin/posts', { method: 'POST', body: JSON.stringify(payload) })
}

export async function patchAdminPost(id, payload) {
  return apiFetchWithAuth(`/api/admin/posts/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function deleteAdminPost(id) {
  return apiFetchWithAuth(`/api/admin/posts/${id}`, { method: 'DELETE' })
}

/** field name must be `file` */
export async function uploadAdminPostImage(file) {
  const fd = new FormData()
  fd.append('file', file)
  return apiFetchWithAuth('/api/admin/uploads/post-image', { method: 'POST', body: fd })
}

/** field name must be `file` */
export async function uploadAdminTitleImage(file) {
  const fd = new FormData()
  fd.append('file', file)
  return apiFetchWithAuth('/api/admin/uploads/title-image', { method: 'POST', body: fd })
}
