#!/usr/bin/env bash
# ==============================================================================
# JAI Conclave 2026 (EMD) — Backend Deploy Script via Clasp
# ==============================================================================

set -e

echo "🚀 Deploying Apps Script Backend Code..."

if [ ! -f backend/.clasp.json ]; then
  echo "❌ Error: backend/.clasp.json missing. Run 'npm run setup' first."
  exit 1
fi

cd backend
npx @google/clasp push
echo "✅ Code pushed to Google Apps Script."

npx @google/clasp deploy --description "Deployment on $(date)"
echo "🎉 Deployment complete!"
