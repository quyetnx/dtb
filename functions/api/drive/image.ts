import type { PagesFunction } from '@cloudflare/workers-types'
import { getDriveToken } from './_token'

interface Env {
  SESSIONS: KVNamespace
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
}

// GET /api/drive/image?id=<fileId> — public image proxy from Drive
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const fileId = url.searchParams.get('id')
  if (!fileId) return new Response('Missing id', { status: 400 })

  // CF edge cache — on HIT the Worker CPU is not billed
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

  // Write to CF edge cache (fire-and-forget)
  edgeCache?.put(request, response.clone()).catch(() => {})
  return response
}
