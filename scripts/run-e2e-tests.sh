#!/bin/bash

# E2E Test Runner
# This script starts the dev server and runs e2e tests

set -e

echo "🚀 Starting development server..."

# Start dev server in background
pnpm dev &
DEV_PID=$!

# Function to cleanup
cleanup() {
  echo ""
  echo "🛑 Stopping development server..."
  kill $DEV_PID 2>/dev/null || true
  exit
}

# Trap cleanup on exit
trap cleanup EXIT INT TERM

# Wait for server to be ready
echo "⏳ Waiting for server to be ready..."
sleep 5

# Check if server is running
if ! curl -s http://localhost:5173 > /dev/null; then
  echo "❌ Server failed to start"
  exit 1
fi

echo "✅ Server is ready"
echo ""
echo "🧪 Running e2e tests..."
echo ""

# Run tests
pnpm test:e2e

echo ""
echo "✅ Tests complete"
