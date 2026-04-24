import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getAdminMe } from '../api'
import { clearAdminToken, getAdminToken } from './adminAuth'

function RequireAuth({ children }) {
  const [state, setState] = useState('checking')
  const location = useLocation()
  const redirect = encodeURIComponent(`${location.pathname}${location.search || ''}`)

  useEffect(() => {
    const token = getAdminToken()
    if (!token) {
      setState('no')
      return
    }
    getAdminMe(token)
      .then(() => {
        setState('yes')
      })
      .catch(() => {
        clearAdminToken()
        setState('no')
      })
  }, [])

  if (state === 'checking') {
    return <div style={{ padding: 24, color: '#4b5563' }}>Đang xác thực…</div>
  }

  if (state === 'no') {
    return <Navigate to={`/admin/login?redirect=${redirect}`} replace />
  }

  return children
}

export default RequireAuth
