#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/abhijeetmurthy/Development/football-news-ai"
LOG_DIR="$ROOT/logs"
RUN_DIR="$ROOT/.run"
mkdir -p "$LOG_DIR" "$RUN_DIR"

pkill -f "node src/server.mjs" || true
pkill -f "vite --host 0.0.0.0 --port 54173" || true

(
  cd "$ROOT/apps/api"
  nohup env PORT=58080 npm run dev > "$LOG_DIR/api.log" 2>&1 &
  echo $! > "$RUN_DIR/api.pid"
)

(
  cd "$ROOT/apps/web"
  nohup env WEB_PORT=54173 VITE_API_URL=http://127.0.0.1:58080 npm run dev -- --host 0.0.0.0 --port 54173 --strictPort > "$LOG_DIR/web.log" 2>&1 &
  echo $! > "$RUN_DIR/web.pid"
)

sleep 3

echo "API PID: $(cat "$RUN_DIR/api.pid")"
echo "WEB PID: $(cat "$RUN_DIR/web.pid")"
echo "API URL: http://127.0.0.1:58080/api/overview"
echo "WEB URL: http://127.0.0.1:54173"
