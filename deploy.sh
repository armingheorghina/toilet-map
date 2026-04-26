#!/usr/bin/env bash
set -euo pipefail

PRODUCTION_BRANCH="${PRODUCTION_BRANCH:-master}"
MERGE_TO_PRODUCTION="${MERGE_TO_PRODUCTION:-0}"
CURRENT_BRANCH="$(git branch --show-current)"
COMMIT_MESSAGE="${1:-Deploy update}"

if [[ -z "${GIT_AUTHOR_NAME:-}" || -z "${GIT_AUTHOR_EMAIL:-}" ]]; then
  GIT_AUTHOR_NAME="$(git log -1 --format='%an')"
  GIT_AUTHOR_EMAIL="$(git log -1 --format='%ae')"
  export GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL
fi

if [[ -z "${GIT_COMMITTER_NAME:-}" || -z "${GIT_COMMITTER_EMAIL:-}" ]]; then
  GIT_COMMITTER_NAME="${GIT_AUTHOR_NAME}"
  GIT_COMMITTER_EMAIL="${GIT_AUTHOR_EMAIL}"
  export GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL
fi

if [[ -n "$(git status --porcelain)" ]]; then
  git add -A
  git commit -m "$COMMIT_MESSAGE"
else
  echo "No local changes to commit."
fi

echo "Running smoke checks..."
if command -v node >/dev/null 2>&1; then
  node tests/smoke-check.mjs
elif command -v node.exe >/dev/null 2>&1; then
  node.exe tests/smoke-check.mjs
else
  powershell.exe -NoProfile -Command "node tests/smoke-check.mjs"
fi

echo "Pushing ${CURRENT_BRANCH}..."
git push origin "${CURRENT_BRANCH}"

if [[ "${MERGE_TO_PRODUCTION}" == "1" && "${CURRENT_BRANCH}" != "${PRODUCTION_BRANCH}" ]]; then
  ORIGINAL_BRANCH="${CURRENT_BRANCH}"
  trap 'git checkout "${ORIGINAL_BRANCH}" >/dev/null 2>&1 || true' EXIT

  echo "Updating ${PRODUCTION_BRANCH}..."
  git checkout "${PRODUCTION_BRANCH}"
  git pull --ff-only origin "${PRODUCTION_BRANCH}"

  echo "Merging ${ORIGINAL_BRANCH} into ${PRODUCTION_BRANCH}..."
  git merge --no-ff "${ORIGINAL_BRANCH}" -m "Merge ${ORIGINAL_BRANCH}: ${COMMIT_MESSAGE}"

  echo "Pushing ${PRODUCTION_BRANCH} (triggers production deploy)..."
  git push origin "${PRODUCTION_BRANCH}"

  git checkout "${ORIGINAL_BRANCH}"
  trap - EXIT
else
  if [[ "${CURRENT_BRANCH}" == "${PRODUCTION_BRANCH}" ]]; then
    echo "Already on ${PRODUCTION_BRANCH}; deploy trigger is this push."
  else
    echo "Skipping merge to ${PRODUCTION_BRANCH} (MERGE_TO_PRODUCTION=${MERGE_TO_PRODUCTION})."
    echo "Deploy is triggered from current branch: ${CURRENT_BRANCH}."
  fi
fi

echo "Done. Watch deploy: gh run list --workflow \"Deploy GitHub Pages\" --limit 5"
