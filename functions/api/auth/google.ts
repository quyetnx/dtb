import type { PagesFunction } from '@cloudflare/workers-types'

interface Env {
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  ADMIN_EMAILS: string
  SESSION_SECRET: string
  SESSIONS: KVNamespace
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const redirectUri = `${url.origin}/api/auth/callback`

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid email profile')
  authUrl.searchParams.set('access_type', 'online')
  authUrl.searchParams.set('prompt', 'select_account')

  return Response.redirect(authUrl.toString(), 302)
}
