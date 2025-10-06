#!/bin/bash

# Server Runner Script
# 
# This script changes the current working directory to the specified path
# before running the server. This ensures that the server operates in the
# correct directory context for testing.
#
# This is necessary because the server uses process.cwd() to determine the project path,
# and the StdioClientTransport's cwd option doesn't properly isolate the server process.
# By explicitly changing directory in a wrapper script, we ensure the server operates
# on a clean test directory rather than the current project directory.

# Get the target directory from command line arguments
TARGET_DIR="$1"
SERVER_PATH="$2"

if [ -z "$TARGET_DIR" ] || [ -z "$SERVER_PATH" ]; then
  echo "Usage: ./run-server-in-dir.sh <target-directory> <server-path>"
  exit 1
fi

# Change to the target directory
cd "$TARGET_DIR" || exit 1

# Run the server
node "$SERVER_PATH"
