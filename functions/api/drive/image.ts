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

  const token = await getDriveToken(env)

  const [metaRes, contentRes] = await Promise.all([
    fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType&supportsAllDrives=true`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ])

  if (!contentRes.ok) return new Response('Not found', { status: 404 })

  const { mimeType } = metaRes.ok
    ? (await metaRes.json() as { mimeType: string })
    : { mimeType: 'image/jpeg' }

  return new Response(contentRes.body, {
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
