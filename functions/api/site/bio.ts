import type { PagesFunction } from '@cloudflare/workers-types'

interface Env { SESSIONS: KVNamespace }

const KV_KEY = 'site:bio'

const DEFAULT = {
  quote: 'Văn chương là cầu nối giữa tâm hồn con người với con người, giữa quá khứ và hiện tại, giữa đau thương và hy vọng.',
  bio: 'TS, nhà văn, nhà báo Dương Thanh Biểu.',
  bioDetail: 'Tác phẩm của ông phản ánh sâu sắc hiện thực lịch sử, tình người và quê hương đất nước qua từng giai đoạn của dân tộc.',
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const raw = await env.SESSIONS.get(KV_KEY)
  const data = raw ? JSON.parse(raw) : DEFAULT
  return Response.json(data, { headers: { 'Cache-Control': 'public, max-age=60' } })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json() as { quote?: string; bio?: string; bioDetail?: string }
  await env.SESSIONS.put(KV_KEY, JSON.stringify(body))
  return Response.json({ success: true })
}
