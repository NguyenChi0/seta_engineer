const htmlCache = new Map()
const pendingCache = new Map()

export async function fetchHtmlCached(url) {
  if (htmlCache.has(url)) {
    return htmlCache.get(url)
  }

  if (pendingCache.has(url)) {
    return pendingCache.get(url)
  }

  const request = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to fetch: ${url}`)
      return response.text()
    })
    .then((text) => {
      htmlCache.set(url, text)
      pendingCache.delete(url)
      return text
    })
    .catch((error) => {
      pendingCache.delete(url)
      throw error
    })

  pendingCache.set(url, request)
  return request
}
