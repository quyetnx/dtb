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

  let token: string
  try {
    token = await getDriveToken(env)
  } catch (e) {
    return Response.json({ error: 'Drive chưa được kết nối. Vào Cài đặt để kết nối Drive.' }, { status: 503 })
  }

  const folderId = env.GOOGLE_DRIVE_FOLDER_ID ?? ''
  const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name&supportsAllDrives=true'

  const buildBody = (withParent: boolean) => {
    const metadata: Record<string, unknown> = { name, mimeType: file.type }
    if (withParent && folderId) metadata.parents = [folderId]
    const body = new FormData()
    body.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    body.append('file', file)
    return body
  }

  let res = await fetch(uploadUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: buildBody(true),
  })

  if (!res.ok && res.status === 404 && folderId) {
    console.warn('[upload-image] folder 404, retrying without parent', folderId)
    res = await fetch(uploadUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: buildBody(false),
    })
  }

  if (!res.ok) {
    const errText = await res.text()
    console.error('[upload-image] failed', res.status, errText)
    let detail = errText
    try { detail = JSON.stringify((JSON.parse(errText) as { error?: unknown }).error ?? JSON.parse(errText)) } catch { /* keep raw */ }
    return Response.json({ error: `Drive API ${res.status}`, detail }, { status: 500 })
  }

  return Response.json(await res.json(), { status: 201 })
}
