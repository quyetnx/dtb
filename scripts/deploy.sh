#!/bin/bash
set -e

# Deploy code first so the latest version is active,
# then push secrets (each secret put triggers a fast re-deploy with updated bindings).
npx wrangler deploy

for SECRET in GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET SESSION_SECRET ADMIN_EMAILS DRIVE_ACCOUNT_EMAIL YOUTUBE_API_KEY YOUTUBE_CHANNEL_ID; do
  VALUE="${!SECRET}"
  if [ -n "$VALUE" ]; then
    echo "$VALUE" | npx wrangler secret put "$SECRET"
    echo "✓ $SECRET set"
  else
    echo "⚠ $SECRET is empty, skipping"
  fi
done
