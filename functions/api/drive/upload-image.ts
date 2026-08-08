import type { PagesFunction } from '@cloudflare/workers-types'
import { getDriveToken } from './_token'

interface Env {
  GOOGLE_DRIVE_FOLDER_ID?: string
  SESSIONS: KVNamespace
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const name = (formData.get('name') as string | null) ?? 'image'

  if (!file) return Response.json({ error: 'No file' }, { status: 400 })

  const token = await getDriveToken(env)

  const metadata: Record<string, unknown> = { name, mimeType: file.type }
  if (env.GOOGLE_DRIVE_FOLDER_ID) metadata.parents = [env.GOOGLE_DRIVE_FOLDER_ID]

  const body = new FormData()
  body.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  body.append('file', file)

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name&supportsAllDrives=true',
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body },
  )

  if (!res.ok) {
    const err = await res.text()
    console.error('[upload-image] failed', res.status, err)
    return Response.json({ error: 'Upload failed', detail: err }, { status: 500 })
  }

  return Response.json(await res.json(), { status: 201 })
}
