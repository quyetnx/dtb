/**
 * Resolve the configured Drive folder ID.
 * Priority: KV 'site:driveFolder' → env GOOGLE_DRIVE_FOLDER_ID → ''
 */
export async function getDriveFolder(env: { SESSIONS: KVNamespace; GOOGLE_DRIVE_FOLDER_ID?: string }): Promise<string> {
  const kv = await env.SESSIONS.get('site:driveFolder')
  return kv ?? env.GOOGLE_DRIVE_FOLDER_ID ?? ''
}
