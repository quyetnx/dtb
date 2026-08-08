interface DriveEnv {
  SESSIONS: KVNamespace
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
}

/**
 * Returns a valid Drive access token for the logged-in admin.
 * Uses cached token from KV; refreshes automatically when expired.
 * Admin must have logged in at least once (with Drive scope) to populate KV.
 */
export async function getDriveToken(env: DriveEnv): Promise<string> {
  // 1. Try cached access_token (expires after 55 min in KV)
  const cached = await env.SESSIONS.get('drive:access_token')
  if (cached) return cached

  // 2. Get stored refresh_token
  const refreshToken = await env.SESSIONS.get('drive:refresh_token')
  if (!refreshToken) {
    throw new Error('Drive not authorized. Admin must log in first.')
  }

  // 3. Exchange refresh_token for new access_token
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token refresh failed: ${res.status} ${err}`)
  }

  const { access_token } = (await res.json()) as { access_token: string }

  // 4. Cache for 55 minutes (token expires after 60 min)
  await env.SESSIONS.put('drive:access_token', access_token, { expirationTtl: 3300 })

  return access_token
}
