#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR/backend-java"

if [ ! -d "bin" ] || [ ! -f "bin/com/codeverse/Main.class" ]; then
    echo "Compiling Java Backend sources..."
    ./compile.sh
fi

echo "=========================================================="
echo " Starting CodeVerse Java Web Server on http://localhost:8080"
echo "=========================================================="
./run.sh 8080
