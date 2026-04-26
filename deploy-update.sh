#!/usr/bin/env bash
set -euo pipefail

# Convenience wrapper: deploy current branch without merging to production branch.
MERGE_TO_PRODUCTION="${MERGE_TO_PRODUCTION:-0}" bash "./deploy.sh" "${1:-Deploy update}"
