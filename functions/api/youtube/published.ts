import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  SESSIONS: KVNamespace
}

const KV_KEY = 'youtube:published'

async function getPublished(env: Env): Promise<string[]> {
  const data = await env.SESSIONS.get(KV_KEY, { type: 'json' }) as { ids: string[] } | null
  return data?.ids ?? []
}

// GET — return published video IDs (admin only, auth enforced in worker)
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const ids = await getPublished(env)
  return Response.json({ ids })
}

// POST — toggle publish status: { id: string, published: boolean }
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json() as { id: string; published: boolean }
  if (!body.id) return Response.json({ error: 'Missing id' }, { status: 400 })

  const ids = new Set(await getPublished(env))
  if (body.published) ids.add(body.id)
  else ids.delete(body.id)

  await env.SESSIONS.put(KV_KEY, JSON.stringify({ ids: [...ids] }))
  return Response.json({ ok: true, ids: [...ids] })
}
