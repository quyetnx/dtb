import type { PagesFunction } from '@cloudflare/workers-types'
import { getDriveToken } from './_token'
import { getDriveFolder } from './_folder'

interface Env {
  GOOGLE_DRIVE_FOLDER_ID?: string
  SESSIONS: KVNamespace
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const folder = url.searchParams.get('folder') ?? await getDriveFolder(env)
  const type = url.searchParams.get('type')
  const isAdmin = url.searchParams.get('admin') === '1'

  // Public listing: serve from KV cache (5 min) to avoid hitting Drive API every request
  if (!isAdmin) {
    const cacheKey = `drive:list:${folder ?? 'default'}:${type ?? 'all'}`
    const cached = await env.SESSIONS.get(cacheKey, { type: 'json' })
    if (cached) {
      return Response.json(cached, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } })
    }
  }

  let token: string
  try {
    token = await getDriveToken(env)
  } catch (e) {
    return Response.json({ error: 'Drive chưa được kết nối. Vào Cài đặt để kết nối Drive.', files: [] }, { status: 503 })
  }

  const mimeFilter = type === 'image'
    ? "mimeType contains 'image/'"
    : "mimeType='text/plain' or mimeType='text/markdown' or mimeType='application/vnd.google-apps.document'"

  const parentFilter = folder ? `'${folder}' in parents and ` : ''
  const driveUrl = new URL('https://www.googleapis.com/drive/v3/files')
  driveUrl.searchParams.set('q', `${parentFilter}trashed=false and (${mimeFilter})`)
  driveUrl.searchParams.set('fields', 'files(id,name,mimeType,modifiedTime,size,description,appProperties,thumbnailLink)')
  driveUrl.searchParams.set('orderBy', 'modifiedTime desc')
  driveUrl.searchParams.set('pageSize', '100')
  driveUrl.searchParams.set('supportsAllDrives', 'true')
  driveUrl.searchParams.set('includeItemsFromAllDrives', 'true')

  const res = await fetch(driveUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[drive/list] Drive API error', res.status, err)
    return Response.json({ error: 'Drive API error', detail: err }, { status: 500 })
  }

  const data = await res.json() as { files: { appProperties?: { status?: string } }[] }

  if (isAdmin) {
    return Response.json(data, { headers: { 'Cache-Control': 'private, no-store' } })
  }

  // Filter to published only, then cache in KV for 5 min
  data.files = (data.files ?? []).filter((f) => f.appProperties?.status === 'published')
  const cacheKey = `drive:list:${folder ?? 'default'}:${type ?? 'all'}`
  await env.SESSIONS.put(cacheKey, JSON.stringify(data), { expirationTtl: 300 })

  return Response.json(data, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } })
}
