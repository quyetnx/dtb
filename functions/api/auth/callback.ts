import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  ADMIN_EMAILS: string
  SESSION_SECRET: string
  SESSIONS: KVNamespace
  DRIVE_ACCOUNT_EMAIL?: string  // The ONE Google account whose Drive stores all content
}

interface GoogleTokenResponse {
  access_token: string
  refresh_token?: string
  id_token: string
  token_type: string
}

interface GoogleUserInfo {
  email: string
  name: string
  picture: string
  sub: string
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const stateNext = url.searchParams.get('state') ?? ''  // safe internal redirect path

  if (!code) {
    return new Response('Missing authorization code', { status: 400 })
  }

  const redirectUri = `${url.origin}/api/auth/callback`

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return new Response('Failed to exchange token', { status: 401 })
  }

  const tokens: GoogleTokenResponse = await tokenRes.json()

  // Get user info
  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })

  if (!userRes.ok) {
    return new Response('Failed to get user info', { status: 401 })
  }

  const user: GoogleUserInfo = await userRes.json()

  // Check admin whitelist
  const allowedEmails = env.ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase())
  if (!allowedEmails.includes(user.email.toLowerCase())) {
    return new Response('Access denied: email not authorized', { status: 403 })
  }

  // Store Drive credentials only for the designated content account.
  // If DRIVE_ACCOUNT_EMAIL is set: only that email can overwrite the Drive token.
  // If not set: first admin to log in with a refresh_token sets it (don't overwrite).
  const driveEmail = env.DRIVE_ACCOUNT_EMAIL?.trim().toLowerCase() ?? ''
  let canWriteDriveToken = false
  if (driveEmail) {
    canWriteDriveToken = user.email.toLowerCase() === driveEmail
  } else {
    const existing = await env.SESSIONS.get('drive:refresh_token')
    canWriteDriveToken = !existing
  }

  if (canWriteDriveToken) {
    if (tokens.refresh_token) {
      await env.SESSIONS.put('drive:refresh_token', tokens.refresh_token)
      await env.SESSIONS.put('drive:account_email', user.email)
    }
    if (tokens.access_token) {
      await env.SESSIONS.put('drive:access_token', tokens.access_token, { expirationTtl: 3300 })
    }
  }

  // Create session
  const sessionId = crypto.randomUUID()
  const sessionData = JSON.stringify({
    email: user.email,
    name: user.name,
    picture: user.picture,
    createdAt: Date.now(),
  })

  await env.SESSIONS.put(`session:${sessionId}`, sessionData, { expirationTtl: 86400 * 7 }) // 7 days

  const redirectTo = stateNext.startsWith('/') ? stateNext : '/admin'

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTo,
      'Set-Cookie': `session_id=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${86400 * 7}`,
    },
  })
}
