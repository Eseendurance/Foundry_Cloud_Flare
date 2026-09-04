#!/usr/bin/env bash

# Check if a commit message was provided
if [ -z "$1" ]; then
  echo "Error: Please provide a commit message."
  echo "Usage: ./deploy.sh \"your commit message\""
  exit 1
fi

echo "🚀 Staging changes..."
git add .

echo "📝 Committing changes..."
git commit -m "$1"

echo "⬆️ Pushing to GitHub (Vercel will auto-deploy)..."
git push origin main

echo "✅ Done! Check your Vercel dashboard or deployment logs."