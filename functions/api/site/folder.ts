import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  SESSIONS: KVNamespace
  GOOGLE_DRIVE_FOLDER_ID?: string
}

// GET /api/site/folder — current folder setting
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const kv = await env.SESSIONS.get('site:driveFolder')
  return Response.json({
    folderId: kv ?? env.GOOGLE_DRIVE_FOLDER_ID ?? '',
    source: kv ? 'kv' : env.GOOGLE_DRIVE_FOLDER_ID ? 'env' : 'none',
  })
}

// POST /api/site/folder — save folder setting to KV
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { folderId } = await request.json() as { folderId: string }
  if (typeof folderId !== 'string') return Response.json({ error: 'Invalid' }, { status: 400 })

  if (folderId) {
    await env.SESSIONS.put('site:driveFolder', folderId)
  } else {
    await env.SESSIONS.delete('site:driveFolder')
  }
  return Response.json({ ok: true })
}
