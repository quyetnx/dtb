import type { PagesFunction } from '@cloudflare/workers-types'
import { getDriveToken } from './_token'

interface Env {
  GOOGLE_DRIVE_FOLDER_ID?: string
  SESSIONS: KVNamespace
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
}

// GET /api/drive/file?id=<fileId> — read file content + metadata (public)
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const fileId = url.searchParams.get('id')
  if (!fileId) return Response.json({ error: 'Missing id' }, { status: 400 })

  const token = await getDriveToken(env)

  const [contentRes, metaRes] = await Promise.all([
    fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,modifiedTime,appProperties&supportsAllDrives=true`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ])

  if (!contentRes.ok) return Response.json({ error: 'File not found' }, { status: 404 })

  const content = await contentRes.text()
  const meta = metaRes.ok ? await metaRes.json() : {}
  return Response.json({ content, ...meta })
}

// POST /api/drive/file — create new file
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json() as {
    name: string
    content: string
    folder?: string
    appProperties?: Record<string, string>
  }

  const token = await getDriveToken(env)
  const folderId = body.folder ?? env.GOOGLE_DRIVE_FOLDER_ID ?? ''

  const metadata: Record<string, unknown> = {
    name: body.name,
    mimeType: 'text/plain',
    appProperties: body.appProperties ?? {},
  }
  if (folderId) metadata.parents = [folderId]

  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', new Blob([body.content], { type: 'text/plain' }))

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime&supportsAllDrives=true',
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form },
  )

  if (!res.ok) {
    const err = await res.text()
    console.error('[drive/file] POST failed', res.status, err)
    return Response.json({ error: 'Upload failed', detail: err }, { status: 500 })
  }

  return Response.json(await res.json(), { status: 201 })
}

// PATCH /api/drive/file?id=<fileId> — update file content and/or metadata
export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const fileId = url.searchParams.get('id')
  if (!fileId) return Response.json({ error: 'Missing id' }, { status: 400 })

  const body = await request.json() as {
    content?: string
    name?: string
    appProperties?: Record<string, string>
  }

  const token = await getDriveToken(env)

  if (body.name || body.appProperties) {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: body.name, appProperties: body.appProperties }),
    })
  }

  if (body.content !== undefined) {
    await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&supportsAllDrives=true`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/plain' },
      body: body.content,
    })
  }

  return Response.json({ success: true })
}

// DELETE /api/drive/file?id=<fileId> — trash file
export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const fileId = url.searchParams.get('id')
  if (!fileId) return Response.json({ error: 'Missing id' }, { status: 400 })

  const token = await getDriveToken(env)
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/trash`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })

  return Response.json({ success: true })
}
