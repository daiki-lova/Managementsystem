#!/bin/bash
# 他のプロジェクトの環境変数をクリア
unset SUPABASE_URL
unset SUPABASE_ANON_KEY
unset SUPABASE_SERVICE_ROLE_KEY

# このプロジェクト用の正しい値を設定
export SUPABASE_URL="https://towhsfpfillkftcgqflp.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvd2hzZnBmaWxsa2Z0Y2dxZmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNjExMDUsImV4cCI6MjA4MDgzNzEwNX0.f7NmM0W5osBtB-P5Z2PZOCOZk0QqiH2cwL003Rw5q9k"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvd2hzZnBmaWxsa2Z0Y2dxZmxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI2MTEwNSwiZXhwIjoyMDgwODM3MTA1fQ.5VkurH3RA4T4lpVMNDAHQfAeVqzYDoVp5ejjzNdk51w"

echo "Starting development servers for yoga-media-cms..."
echo "SUPABASE_URL: $SUPABASE_URL"

# ポート番号（デフォルト3001）
PORT=${1:-3001}

# Next.jsサーバー起動
npm run dev -- --port $PORT &
NEXT_PID=$!

# 少し待ってからInngest起動
sleep 5
npx inngest-cli@latest dev -u http://localhost:$PORT/api/inngest &
INNGEST_PID=$!

echo ""
echo "Started Next.js (PID: $NEXT_PID) on port $PORT"
echo "Started Inngest (PID: $INNGEST_PID)"
echo ""
echo "Press Ctrl+C to stop both servers"

# Ctrl+Cで両方のサーバーを停止
trap "kill $NEXT_PID $INNGEST_PID 2>/dev/null; exit" INT TERM
wait
