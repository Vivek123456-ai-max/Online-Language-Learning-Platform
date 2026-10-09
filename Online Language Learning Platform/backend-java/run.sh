#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

if [ ! -d "bin" ] || [ ! -f "bin/com/codeverse/Main.class" ]; then
    echo "Running compilation first..."
    ./compile.sh
fi

PORT=${1:-8080}

echo "Starting CodeVerse Java Web Server on port $PORT..."
java -cp "bin:lib/*" com.codeverse.Main $PORT
