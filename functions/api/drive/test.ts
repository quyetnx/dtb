import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  GOOGLE_SERVICE_ACCOUNT_KEY: string
  GOOGLE_DRIVE_FOLDER_ID: string
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const result: Record<string, unknown> = {}

  // Step 1: parse service account key
  let key: Record<string, string>
  try {
    key = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_KEY)
    result.key_parsed = true
    result.client_email = key.client_email
    result.folder_id = env.GOOGLE_DRIVE_FOLDER_ID
  } catch (e) {
    return Response.json({ ...result, key_parsed: false, error: String(e) })
  }

  // Step 2: get token
  let token: string
  try {
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
    const tokenData = await tokenRes.json() as { access_token?: string; error?: string; error_description?: string }
    result.token_status = tokenRes.status
    if (!tokenRes.ok || !tokenData.access_token) {
      return Response.json({ ...result, token_ok: false, token_error: tokenData })
    }
    result.token_ok = true
    token = tokenData.access_token
  } catch (e) {
    return Response.json({ ...result, token_ok: false, error: String(e) })
  }

  // Step 3: list files in folder
  const driveRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${env.GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed=false&fields=files(id,name)&pageSize=5`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  const driveData = await driveRes.json()
  result.drive_status = driveRes.status
  result.drive_response = driveData

  return Response.json(result)
}
