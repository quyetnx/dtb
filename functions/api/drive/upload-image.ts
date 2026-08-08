import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  GOOGLE_SERVICE_ACCOUNT_KEY: string
  GOOGLE_DRIVE_FOLDER_ID: string
  SESSIONS: KVNamespace
}

async function getServiceAccountToken(serviceAccountKey: string): Promise<string> {
  const key = JSON.parse(serviceAccountKey)
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/drive',
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
    'pkcs8', binaryKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'],
  )
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(signingInput))
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${signingInput}.${sig}` }),
  })
  const { access_token } = (await tokenRes.json()) as { access_token: string }
  return access_token
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const name = (formData.get('name') as string | null) ?? 'image'

  if (!file) return Response.json({ error: 'No file' }, { status: 400 })

  const token = await getServiceAccountToken(env.GOOGLE_SERVICE_ACCOUNT_KEY)
  const metadata = {
    name,
    parents: [env.GOOGLE_DRIVE_FOLDER_ID],
    mimeType: file.type,
  }

  const body = new FormData()
  body.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  body.append('file', file)

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body },
  )

  if (!res.ok) return Response.json({ error: 'Upload failed' }, { status: 500 })
  return Response.json(await res.json(), { status: 201 })
}
