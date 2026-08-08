import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  SESSIONS: KVNamespace
  DRIVE_ACCOUNT_EMAIL?: string
}

// GET /api/drive/status — protected: returns Drive connection state
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const refreshToken = await env.SESSIONS.get('drive:refresh_token')
  const accountEmail = await env.SESSIONS.get('drive:account_email')
  const driveAccountEmail = env.DRIVE_ACCOUNT_EMAIL?.trim() ?? ''

  return Response.json({
    connected: !!refreshToken,
    email: accountEmail ?? null,
    expectedEmail: driveAccountEmail || null,
  })
}
