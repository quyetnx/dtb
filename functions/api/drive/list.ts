import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  GOOGLE_SERVICE_ACCOUNT_KEY: string
  GOOGLE_DRIVE_FOLDER_ID: string
  SESSIONS: KVNamespace
}

async function getServiceAccountToken(serviceAccountKey: string): Promise<string> {
  const key = JSON.parse(serviceAccountKey)

  // Create JWT for service account
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  const signingInput = `${encode(header)}.${encode(payload)}`

  // Import RSA private key
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

  const jwt = `${signingInput}.${sig}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  const { access_token } = (await tokenRes.json()) as { access_token: string }
  return access_token
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const folder = url.searchParams.get('folder') ?? env.GOOGLE_DRIVE_FOLDER_ID
  const type = url.searchParams.get('type') // poem, article, memoir, arts, image

  const token = await getServiceAccountToken(env.GOOGLE_SERVICE_ACCOUNT_KEY)

  const isAdmin = url.searchParams.get('admin') === '1'
  const mimeFilter = type === 'image'
    ? "mimeType contains 'image/'"
    : "mimeType='text/plain' or mimeType='text/markdown'"

  const driveUrl = new URL('https://www.googleapis.com/drive/v3/files')
  driveUrl.searchParams.set('q', `'${folder}' in parents and trashed=false and (${mimeFilter})`)
  driveUrl.searchParams.set('fields', 'files(id,name,mimeType,modifiedTime,size,description,appProperties)')
  driveUrl.searchParams.set('orderBy', 'modifiedTime desc')
  driveUrl.searchParams.set('pageSize', '50')

  const res = await fetch(driveUrl.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    return Response.json({ error: 'Drive API error' }, { status: 500 })
  }

  const data = await res.json() as { files: { appProperties?: { status?: string } }[] }

  // Public API: only return published content. Admin API: return all.
  if (!isAdmin) {
    data.files = (data.files ?? []).filter(
      (f) => f.appProperties?.status === 'published'
    )
  }

  return Response.json(data)
}
