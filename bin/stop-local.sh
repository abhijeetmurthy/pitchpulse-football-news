#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/abhijeetmurthy/Development/football-news-ai"
RUN_DIR="$ROOT/.run"

for svc in api web; do
  pid_file="$RUN_DIR/${svc}.pid"
  if [[ -f "$pid_file" ]]; then
    pid="$(cat "$pid_file")"
    kill "$pid" 2>/dev/null || true
    rm -f "$pid_file"
  fi
done

pkill -f "node src/server.mjs" || true
pkill -f "vite --host 0.0.0.0 --port 54173" || true

echo "Stopped local services."
