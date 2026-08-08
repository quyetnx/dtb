import type { PagesFunction } from '@cloudflare/workers-types'
import { getDriveToken } from './_token'
import { getDriveFolder } from './_folder'

interface Env {
  SESSIONS: KVNamespace
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  GOOGLE_DRIVE_FOLDER_ID?: string
}

// GET /api/drive/folders — list all Drive folders (admin only)
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  let token: string
  try {
    token = await getDriveToken(env)
  } catch {
    return Response.json({ error: 'Drive chưa được kết nối.' }, { status: 503 })
  }

  const driveUrl = new URL('https://www.googleapis.com/drive/v3/files')
  driveUrl.searchParams.set('q', "mimeType='application/vnd.google-apps.folder' and trashed=false")
  driveUrl.searchParams.set('fields', 'files(id,name,parents,driveId)')
  driveUrl.searchParams.set('orderBy', 'name')
  driveUrl.searchParams.set('pageSize', '200')
  driveUrl.searchParams.set('supportsAllDrives', 'true')
  driveUrl.searchParams.set('includeItemsFromAllDrives', 'true')

  const res = await fetch(driveUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const err = await res.text()
    return Response.json({ error: 'Drive API error', detail: err }, { status: 500 })
  }

  const data = await res.json() as { files: { id: string; name: string }[] }

  // Also return currently configured folder
  const currentFolder = await getDriveFolder(env)

  return Response.json({ folders: data.files ?? [], currentFolder })
}
