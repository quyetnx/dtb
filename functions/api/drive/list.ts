import type { PagesFunction } from '@cloudflare/workers-types'
import { getDriveToken } from './_token'

interface Env {
  GOOGLE_DRIVE_FOLDER_ID?: string
  SESSIONS: KVNamespace
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const folder = url.searchParams.get('folder') ?? env.GOOGLE_DRIVE_FOLDER_ID ?? ''
  const type = url.searchParams.get('type')
  const isAdmin = url.searchParams.get('admin') === '1'

  const token = await getDriveToken(env)

  const mimeFilter = type === 'image'
    ? "mimeType contains 'image/'"
    : "mimeType='text/plain' or mimeType='text/markdown'"

  const parentFilter = folder ? `'${folder}' in parents and ` : ''
  const driveUrl = new URL('https://www.googleapis.com/drive/v3/files')
  driveUrl.searchParams.set('q', `${parentFilter}trashed=false and (${mimeFilter})`)
  driveUrl.searchParams.set('fields', 'files(id,name,mimeType,modifiedTime,size,description,appProperties)')
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

  if (!isAdmin) {
    data.files = (data.files ?? []).filter(
      (f) => f.appProperties?.status === 'published'
    )
  }

  return Response.json(data)
}
