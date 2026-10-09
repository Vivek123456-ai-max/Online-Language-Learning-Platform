#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "============================================="
echo "   Compiling CodeVerse Java Web Backend..."
echo "============================================="

mkdir -p bin

# Compile all Java sources including Models, DAOs, JDBC, Servlets, Filters, and Server
javac -cp "lib/*:src/main/java" -d bin $(find src/main/java -name "*.java")

echo "✅ Compilation successful! All classes generated in backend-java/bin"
