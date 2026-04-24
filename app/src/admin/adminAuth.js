const KEY = 'adminToken'

export function getAdminToken() {
  return localStorage.getItem(KEY) || ''
}

export function setAdminToken(token) {
  if (token) {
    localStorage.setItem(KEY, token)
  } else {
    localStorage.removeItem(KEY)
  }
}

export function clearAdminToken() {
  localStorage.removeItem(KEY)
}
