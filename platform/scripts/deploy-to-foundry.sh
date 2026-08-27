#!/usr/bin/env bash
# Pushes this project straight to:
#   https://github.com/Eseendurance/Foundry_Cloud_Flare.git
# so Vercel can import it. Handles the repo being empty OR already
# having something in it (e.g. GitHub auto-created a README).
#
# Usage:
#   chmod +x scripts/deploy-to-foundry.sh
#   ./scripts/deploy-to-foundry.sh

set -euo pipefail
cd "$(dirname "$0")/.."

REPO_URL="https://github.com/Eseendurance/Foundry_Cloud_Flare.git"

echo "== Deploying to $REPO_URL =="

# 1. Init repo if needed
if [ ! -d ".git" ]; then
  echo "Initializing git..."
  git init -b main
fi

# 2. Make sure we're on main
current_branch="$(git symbolic-ref --short -q HEAD || true)"
if [ -n "$current_branch" ] && [ "$current_branch" != "main" ]; then
  git branch -M main
fi

# 3. Identity, only if git doesn't already know who you are
if ! git config user.email &> /dev/null; then
  read -rp "Git commit email: " git_email
  git config user.email "$git_email"
fi
if ! git config user.name &> /dev/null; then
  read -rp "Git commit name: " git_name
  git config user.name "$git_name"
fi

# 4. Point 'origin' at your repo
if git remote get-url origin &> /dev/null; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

# 5. Commit everything
git add -A
if git diff --cached --quiet; then
  echo "Nothing new to commit."
else
  git commit -m "Deploy: Groundwork platform"
fi

# 6. Push — handle the repo already having commits (e.g. an
#    auto-created README) by merging that history in first, rather
#    than failing or silently force-overwriting it.
echo "Pushing to origin main..."
if git push -u origin main 2>/tmp/push-error.log; then
  echo "Pushed cleanly."
else
  if grep -q "rejected\|fetch first\|non-fast-forward" /tmp/push-error.log; then
    echo "The remote repo already has commits on it (e.g. a README GitHub added)."
    read -rp "Merge that history in and push? [Y/n]: " merge_ans
    if [[ "$merge_ans" =~ ^[Nn]$ ]]; then
      echo "Stopped without pushing. Resolve manually with git pull/push, or"
      echo "delete the file(s) causing the conflict on GitHub and re-run this script."
      exit 1
    fi
    git pull origin main --allow-unrelated-histories --no-rebase -m "Merge existing repo content"
    git push -u origin main
  else
    echo "Push failed for a different reason:"
    cat /tmp/push-error.log
    exit 1
  fi
fi
rm -f /tmp/push-error.log

echo ""
echo "Done. Code is at $REPO_URL"
echo ""
echo "Next:"
echo "  1. Go to https://vercel.com/new"
echo "  2. Import Eseendurance/Foundry_Cloud_Flare"
echo "  3. Add environment variables from .env.example as needed"
echo "  4. Deploy"
echo ""
echo "After that, every 'git push' to main redeploys automatically."
