import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  SESSIONS: KVNamespace
}

const KV_KEY = 'site:public'

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const val = await env.SESSIONS.get(KV_KEY)
  return Response.json({ public: val === 'true' })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const { public: isPublic } = await request.json() as { public: boolean }
  await env.SESSIONS.put(KV_KEY, isPublic ? 'true' : 'false')
  return Response.json({ public: isPublic })
}
