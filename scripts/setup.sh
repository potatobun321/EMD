#!/usr/bin/env bash
# ==============================================================================
# JAI Conclave 2026 (EMD) — Developer Setup Script
# ==============================================================================

set -e

echo "🚀 Setting up JAI Conclave 2026 (EMD) project..."

if [ ! -f .env ]; then
  echo "📋 Creating .env from .env.example..."
  cp .env.example .env
  echo "⚠️ Please edit .env with your actual Google Apps Script Web App URL and Folder IDs."
fi

if [ ! -f backend/.clasp.json ]; then
  echo "⚙️ Creating backend/.clasp.json from template..."
  cp backend/.clasp.json.template backend/.clasp.json
  echo "⚠️ Please edit backend/.clasp.json with your Apps Script project ID."
fi

echo "📦 Installing NPM dependencies..."
npm install --silent

echo "✅ Environment setup complete! Run 'npm run dev' to launch local PWA scanner."
