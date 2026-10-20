#!/usr/bin/env bash
# Ship StoreToIssues: push + Vercel production deploy.
# Usage:
#   scripts/ship.sh
#   scripts/ship.sh --commit "Commit message here."
set -euo pipefail
cd "$(dirname "$0")/.."

COMMIT_MSG=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --commit)
      COMMIT_MSG="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -n "$COMMIT_MSG" ]]; then
  git add -A
  git reset -q -- .env .env.local .env.vercel 2>/dev/null || true
  if ! git diff --cached --quiet; then
    git commit -m "$COMMIT_MSG"
  else
    echo "Nothing to commit."
  fi
fi

echo "Pushing to origin..."
# Avoid fine-grained GITHUB_TOKEN overriding gh credentials; HTTP/1.1 helps flaky networks
if ! GIT_HTTP_VERSION=1.1 env -u GH_TOKEN -u GITHUB_TOKEN git push -u origin HEAD; then
  echo "Push failed. Fix network/auth, then re-run. Deploy skipped." >&2
  exit 1
fi

echo "Deploying Vercel production..."
vercel --prod --yes

echo "Done → https://store-to-issues.vercel.app"
