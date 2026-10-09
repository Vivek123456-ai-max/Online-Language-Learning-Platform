#!/bin/bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR/backend-java"

./compile.sh
echo ""
java -cp "bin:lib/*" com.codeverse.test.BackendVerificationTest
