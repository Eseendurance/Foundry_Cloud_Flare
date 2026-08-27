#!/usr/bin/env bash
# Pushes this project to GitHub, ready for Vercel to import.
#
# Two paths, auto-detected:
#   A) GitHub CLI (`gh`) installed and logged in — creates the repo on
#      GitHub for you and pushes in one go.
#   B) No `gh` — you paste a repo URL (create an empty one first at
#      github.com/new, no README/.gitignore/license) and this script
#      wires it up as `origin` and pushes.
#
# After this finishes: go to vercel.com/new, import the repo, add your
# environment variables (see .env.example), deploy. From then on, every
# push to main redeploys automatically — this script or a plain
# `git push` is all you need going forward.
#
# Usage:
#   chmod +x scripts/push-to-github.sh
#   ./scripts/push-to-github.sh

set -euo pipefail
cd "$(dirname "$0")/.."

echo "== Push to GitHub =="

if ! command -v git &> /dev/null; then
  echo "git isn't installed. Install it first: https://git-scm.com/downloads"
  exit 1
fi

# 1. Init repo if needed
if [ ! -d ".git" ]; then
  echo "No git repo here yet — initializing one."
  git init -b main
else
  echo "Existing git repo found."
  # Make sure we're on a branch named main (Vercel's default production
  # branch assumption). If on something else, ask before renaming.
  current_branch="$(git symbolic-ref --short -q HEAD || true)"
  if [ -n "$current_branch" ] && [ "$current_branch" != "main" ]; then
    echo "Currently on branch '$current_branch', not 'main'."
    read -rp "Rename it to 'main'? (Vercel's default production branch) [y/N]: " rename
    if [[ "$rename" =~ ^[Yy]$ ]]; then
      git branch -m "$current_branch" main
    fi
  fi
fi

# 2. Make sure secrets never get committed
if [ ! -f ".gitignore" ] || ! grep -q "^\.env" .gitignore; then
  echo ".env*.local" >> .gitignore
fi

# 3. Set identity for this repo only, if git has no idea who you are yet
if ! git config user.email &> /dev/null; then
  read -rp "Git commit email: " git_email
  git config user.email "$git_email"
fi
if ! git config user.name &> /dev/null; then
  read -rp "Git commit name: " git_name
  git config user.name "$git_name"
fi

# 4. Stage and commit
git add -A
if git diff --cached --quiet; then
  echo "Nothing new to commit."
else
  read -rp "Commit message [Initial commit]: " commit_msg
  git commit -m "${commit_msg:-Initial commit}"
fi

# 5. Wire up the GitHub remote
if git remote get-url origin &> /dev/null; then
  echo "Remote 'origin' already set: $(git remote get-url origin)"
else
  if command -v gh &> /dev/null && gh auth status &> /dev/null; then
    echo "GitHub CLI found and logged in."
    read -rp "New repo name [groundwork-platform]: " repo_name
    repo_name="${repo_name:-groundwork-platform}"
    read -rp "Public or private? [private]: " visibility
    visibility="${visibility:-private}"
    gh repo create "$repo_name" --"$visibility" --source=. --remote=origin
  else
    echo "GitHub CLI not found (or not logged in)."
    echo "Create an empty repo first — no README, .gitignore, or license —"
    echo "at: https://github.com/new"
    echo ""
    read -rp "Paste its URL (https://github.com/you/repo.git): " repo_url
    if [ -z "$repo_url" ]; then
      echo "No URL given — stopping here. Re-run this script once you have one."
      exit 1
    fi
    git remote add origin "$repo_url"
  fi
fi

# 6. Push
echo "Pushing to origin main..."
git push -u origin main

echo ""
echo "Done. Next: go to https://vercel.com/new, import this repo, add"
echo "your environment variables (see .env.example), and deploy."
echo "Every push to main after that redeploys automatically."
