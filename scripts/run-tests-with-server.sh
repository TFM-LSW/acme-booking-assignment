#!/bin/bash

# Start dev server in background
echo "Starting dev server..."
pnpm dev &
SERVER_PID=$!

# Wait for server to be ready
echo "Waiting for server to be ready..."
for i in {1..30}; do
  if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "Server is ready!"
    break
  fi
  sleep 1
done

# Run tests
echo "Running E2E tests..."
pnpm test:e2e
TEST_EXIT_CODE=$?

# Kill server
echo "Shutting down server..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

exit $TEST_EXIT_CODE
