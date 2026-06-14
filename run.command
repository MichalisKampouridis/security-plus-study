#!/bin/bash
# Security+ SY0-701 Study App launcher (macOS)
cd "$(dirname "$0")"

PORT=8080
URL="http://localhost:$PORT"

echo "Starting Security+ Study App on $URL ..."

# Open the browser shortly after the server starts
( sleep 1 && open "$URL" ) &

# Prefer python3, fall back to python
if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server "$PORT"
elif command -v python >/dev/null 2>&1; then
  python -m http.server "$PORT"
else
  echo "Python 3 is required but was not found. Install it from https://www.python.org/"
  read -p "Press Enter to exit..."
  exit 1
fi
