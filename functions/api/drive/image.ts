import type { PagesFunction } from '@cloudflare/workers-types'
import { getDriveToken } from './_token'

interface Env {
  SESSIONS: KVNamespace
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
}

// GET /api/drive/image?id=<fileId>[&w=<pixels>]
// ?w= uses Drive thumbnailLink for resized delivery; omit for full resolution
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const fileId = url.searchParams.get('id')
  if (!fileId) return new Response('Missing id', { status: 400 })

  const wParam = url.searchParams.get('w')
  const requestedW = wParam ? Math.min(Math.max(parseInt(wParam, 10) || 800, 100), 2000) : null

  // CF edge cache — key includes ?w= so each size is cached separately
  const edgeCache = typeof caches !== 'undefined' ? caches.default : null
  if (edgeCache) {
    const hit = await edgeCache.match(request)
    if (hit) return hit
  }

  let token: string
  try {
    token = await getDriveToken(env)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[drive/image] token error:', msg)
    return new Response('Drive not authorized', { status: 503 })
  }

  // When width requested: use Drive thumbnail URL (much faster, smaller, already CDN-served by Google)
  if (requestedW !== null) {
    const kvKey = `thumb:link:${fileId}`
    let thumbnailLink = await env.SESSIONS.get(kvKey)

    if (!thumbnailLink) {
      const metaRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=thumbnailLink&supportsAllDrives=true`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (metaRes.ok) {
        const { thumbnailLink: link } = await metaRes.json() as { thumbnailLink?: string }
        if (link) {
          thumbnailLink = link
          await env.SESSIONS.put(kvKey, thumbnailLink, { expirationTtl: 21600 })
        }
      }
    }

    if (thumbnailLink) {
      const imgRes = await fetch(thumbnailLink.replace(/=s\d+$/, `=s${requestedW}`))
      if (imgRes.ok) {
        const response = new Response(imgRes.body, {
          headers: {
            'Content-Type': imgRes.headers.get('Content-Type') ?? 'image/jpeg',
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          },
        })
        edgeCache?.put(request, response.clone()).catch(() => {})
        return response
      }
      // Signed URL expired — clear KV so next request re-fetches
      if (imgRes.status === 401 || imgRes.status === 403) {
        env.SESSIONS.delete(kvKey).catch(() => {})
      }
      // Fall through to full-resolution fetch below
    }
  }

  // Full resolution: fetch original file from Drive
  const [metaRes, contentRes] = await Promise.all([
    fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType&supportsAllDrives=true`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ])

  if (!contentRes.ok) {
    const errBody = await contentRes.text()
    console.error('[drive/image] fetch failed', contentRes.status, errBody)
    return new Response('Image not found', { status: 404 })
  }

  const { mimeType } = metaRes.ok
    ? (await metaRes.json() as { mimeType: string })
    : { mimeType: 'image/jpeg' }

  const response = new Response(contentRes.body, {
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })

  edgeCache?.put(request, response.clone()).catch(() => {})
  return response
}
