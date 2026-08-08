import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  GOOGLE_SERVICE_ACCOUNT_KEY: string
}

async function getServiceAccountToken(serviceAccountKey: string): Promise<string> {
  const key = JSON.parse(serviceAccountKey)
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
  const pemContent = key.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  const binaryKey = Uint8Array.from(atob(pemContent), (c) => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', binaryKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'],
  )
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(signingInput))
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${signingInput}.${sig}` }),
  })
  const { access_token } = (await tokenRes.json()) as { access_token: string }
  return access_token
}

// GET /api/drive/image?id=<fileId> — public image proxy from Drive
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const fileId = url.searchParams.get('id')
  if (!fileId) return new Response('Missing id', { status: 400 })

  const token = await getServiceAccountToken(env.GOOGLE_SERVICE_ACCOUNT_KEY)

  const [metaRes, contentRes] = await Promise.all([
    fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType&supportsAllDrives=true`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  ])

  if (!contentRes.ok) return new Response('Not found', { status: 404 })

  const { mimeType } = metaRes.ok
    ? (await metaRes.json() as { mimeType: string })
    : { mimeType: 'image/jpeg' }

  return new Response(contentRes.body, {
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
