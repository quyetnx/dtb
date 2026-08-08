import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  GOOGLE_SERVICE_ACCOUNT_KEY: string
  GOOGLE_DRIVE_FOLDER_ID: string
  SESSIONS: KVNamespace
}

async function getServiceAccountToken(serviceAccountKey: string, scope = 'https://www.googleapis.com/auth/drive'): Promise<string> {
  const key = JSON.parse(serviceAccountKey)
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: key.client_email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  const signingInput = `${encode(header)}.${encode(payload)}`
  const pemContent = key.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')

  const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput),
  )

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${signingInput}.${sig}`,
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    console.error('[drive/file] token error', tokenRes.status, err)
    throw new Error(`Token fetch failed: ${tokenRes.status} ${err}`)
  }

  const tokenData = (await tokenRes.json()) as { access_token: string }
  console.log('[drive/file] token ok, iss:', key.client_email)
  return tokenData.access_token
}

// GET /api/drive/file?id=<fileId> — read file content + metadata
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const fileId = url.searchParams.get('id')
  if (!fileId) return Response.json({ error: 'Missing id' }, { status: 400 })

  const token = await getServiceAccountToken(env.GOOGLE_SERVICE_ACCOUNT_KEY, 'https://www.googleapis.com/auth/drive.readonly')
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

  const token = await getServiceAccountToken(env.GOOGLE_SERVICE_ACCOUNT_KEY)
  const folderId = body.folder ?? env.GOOGLE_DRIVE_FOLDER_ID
  console.log('[drive/file] POST name:', body.name, 'folderId:', folderId)

  const metadata = {
    name: body.name,
    parents: [folderId],
    mimeType: 'text/plain',
    appProperties: body.appProperties ?? {},
  }

  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', new Blob([body.content], { type: 'text/plain' }))

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime&supportsAllDrives=true', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[drive/file] POST upload failed', res.status, err)
    return Response.json({ error: 'Upload failed', detail: err, folderId, folderIdLength: folderId?.length }, { status: 500 })
  }

  const file = await res.json()
  return Response.json(file, { status: 201 })
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

  const token = await getServiceAccountToken(env.GOOGLE_SERVICE_ACCOUNT_KEY)

  // Update metadata if needed
  if (body.name || body.appProperties) {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: body.name, appProperties: body.appProperties }),
    })
  }

  // Update content if provided
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

  const token = await getServiceAccountToken(env.GOOGLE_SERVICE_ACCOUNT_KEY)
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/trash`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })

  return Response.json({ success: true })
}
