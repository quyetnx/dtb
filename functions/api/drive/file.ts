import type { PagesFunction } from '@cloudflare/workers-types'
import mammoth from 'mammoth'
import { getDriveToken } from './_token'
import { getDriveFolder } from './_folder'
import { cleanGoogleDocsHtml } from './_htmlClean'

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

  let token: string
  try {
    token = await getDriveToken(env)
  } catch (e) {
    return Response.json({ error: 'Drive chưa được kết nối. Vào Cài đặt để kết nối Drive.' }, { status: 503 })
  }

  const metaRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,modifiedTime,appProperties,thumbnailLink,description&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!metaRes.ok) {
    const detail = await metaRes.text()
    return Response.json({ error: 'Không tìm thấy file', detail }, { status: 404 })
  }
  const meta = await metaRes.json() as Record<string, unknown>
  const mimeType = meta.mimeType as string

  // Google Docs native → export as HTML (preserves images + formatting)
  if (mimeType === 'application/vnd.google-apps.document') {
    const exportRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/html`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!exportRes.ok) {
      const detail = await exportRes.text()
      return Response.json({ error: 'Xuất tài liệu thất bại', detail }, { status: 500 })
    }
    const rawHtml = await exportRes.text()
    const content = cleanGoogleDocsHtml(rawHtml)
    return Response.json({ content, format: 'html', ...meta })
  }

  // DOCX uploaded to Drive → use mammoth to convert to HTML with embedded images
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const docxRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!docxRes.ok) {
      const detail = await docxRes.text()
      return Response.json({ error: 'Không thể tải file DOCX', detail }, { status: 500 })
    }
    const arrayBuffer = await docxRes.arrayBuffer()
    const result = await mammoth.convertToHtml(
      { arrayBuffer },
      { convertImage: mammoth.images.dataUri },
    )
    if (result.messages.length) {
      console.warn('[drive/file] mammoth warnings', result.messages.slice(0, 3))
    }
    const content = cleanGoogleDocsHtml(result.value)
    return Response.json({ content, format: 'html', ...meta })
  }

  // Plain text / markdown (or HTML saved from DOCX import)
  const contentRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!contentRes.ok) {
    const detail = await contentRes.text()
    console.error('[drive/file] GET content failed', contentRes.status, detail)
    return Response.json({ error: 'Không tìm thấy file', detail }, { status: 404 })
  }
  const content = await contentRes.text()
  const storedFormat = (meta.appProperties as Record<string, string> | null)?.contentFormat
  const format = storedFormat === 'html' ? 'html' : 'markdown'
  return Response.json({ content, format, ...meta })
}

// POST /api/drive/file — create new file
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json() as {
    name: string
    content: string
    folder?: string
    appProperties?: Record<string, string>
    description?: string
  }

  let token: string
  try {
    token = await getDriveToken(env)
  } catch (e) {
    return Response.json({ error: 'Drive chưa được kết nối. Vào Cài đặt để kết nối Drive.' }, { status: 503 })
  }

  const folderId = body.folder ?? await getDriveFolder(env)

  const buildForm = (withParent: boolean) => {
    const metadata: Record<string, unknown> = {
      name: body.name,
      mimeType: 'text/plain',
      appProperties: body.appProperties ?? {},
    }
    if (body.description) metadata.description = body.description
    if (withParent && folderId) metadata.parents = [folderId]
    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('file', new Blob([body.content], { type: 'text/plain' }))
    return form
  }

  const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime&supportsAllDrives=true'

  let res = await fetch(uploadUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: buildForm(true),
  })

  // Folder không truy cập được → thử lại không có parent (lưu vào Drive root)
  if (!res.ok && res.status === 404 && folderId) {
    console.warn('[drive/file] folder 404, retrying without parent', folderId)
    res = await fetch(uploadUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: buildForm(false),
    })
  }

  if (!res.ok) {
    const errText = await res.text()
    console.error('[drive/file] POST failed', res.status, errText)
    let detail = errText
    try { detail = JSON.stringify((JSON.parse(errText) as { error?: unknown }).error ?? JSON.parse(errText)) } catch { /* keep raw */ }
    return Response.json({ error: `Drive API ${res.status}`, detail }, { status: 500 })
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
    description?: string
  }

  let token: string
  try {
    token = await getDriveToken(env)
  } catch (e) {
    return Response.json({ error: 'Drive chưa được kết nối. Vào Cài đặt để kết nối Drive.' }, { status: 503 })
  }

  if (body.name || body.appProperties || body.description !== undefined) {
    const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: body.name, appProperties: body.appProperties, description: body.description }),
    })
    if (!metaRes.ok) {
      const errText = await metaRes.text()
      console.error('[drive/file] PATCH meta failed', metaRes.status, errText)
      let detail = errText
      try { detail = JSON.stringify((JSON.parse(errText) as { error?: unknown }).error ?? JSON.parse(errText)) } catch { /* keep raw */ }
      return Response.json({ error: `Drive API ${metaRes.status} (metadata)`, detail }, { status: 500 })
    }
  }

  if (body.content !== undefined) {
    const contentRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&supportsAllDrives=true`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/plain' },
      body: body.content,
    })
    if (!contentRes.ok) {
      const errText = await contentRes.text()
      console.error('[drive/file] PATCH content failed', contentRes.status, errText)
      let detail = errText
      try { detail = JSON.stringify((JSON.parse(errText) as { error?: unknown }).error ?? JSON.parse(errText)) } catch { /* keep raw */ }
      return Response.json({ error: `Drive API ${contentRes.status} (content)`, detail }, { status: 500 })
    }
  }

  return Response.json({ success: true })
}

// DELETE /api/drive/file?id=<fileId> — trash file
export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const fileId = url.searchParams.get('id')
  if (!fileId) return Response.json({ error: 'Missing id' }, { status: 400 })

  let token: string
  try {
    token = await getDriveToken(env)
  } catch (e) {
    return Response.json({ error: 'Drive chưa được kết nối. Vào Cài đặt để kết nối Drive.' }, { status: 503 })
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ trashed: true }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('[drive/file] DELETE failed', res.status, err)
    return Response.json({ error: 'Xóa file thất bại', detail: err }, { status: 500 })
  }

  return Response.json({ success: true })
}
