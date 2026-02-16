#!/bin/sh
set -e
cd /workspace
if [ ! -d node_modules/.pnpm ]; then
  pnpm install --frozen-lockfile
fi
exec "$@"
