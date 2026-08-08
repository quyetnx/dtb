#!/bin/bash
set -e

# Push secrets from build env vars into Worker runtime bindings
for SECRET in GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET SESSION_SECRET GOOGLE_SERVICE_ACCOUNT_KEY ADMIN_EMAILS GOOGLE_DRIVE_FOLDER_ID YOUTUBE_API_KEY YOUTUBE_CHANNEL_ID; do
  VALUE="${!SECRET}"
  if [ -n "$VALUE" ]; then
    echo "$VALUE" | npx wrangler secret put "$SECRET"
    echo "✓ $SECRET set"
  else
    echo "⚠ $SECRET is empty, skipping"
  fi
done

npx wrangler deploy
