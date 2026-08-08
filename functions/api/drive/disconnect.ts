import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  SESSIONS: KVNamespace
}

// POST /api/drive/disconnect — protected: clear Drive tokens from KV
export const onRequestPost: PagesFunction<Env> = async ({ env }) => {
  await Promise.all([
    env.SESSIONS.delete('drive:refresh_token'),
    env.SESSIONS.delete('drive:access_token'),
    env.SESSIONS.delete('drive:account_email'),
  ])
  return Response.json({ success: true })
}
