#!/bin/bash

# Configuration
GEMINI_DIR=".gemini"
SESSION_FILE="$GEMINI_DIR/.current_session"
POLICY_FILE="$GEMINI_DIR/GEMINI.md"

# Trap to save session ID on exit
# Note: GEMINI_SESSION_ID is often exported by the CLI during execution
trap 'if [ ! -z "$GEMINI_SESSION_ID" ]; then echo "$GEMINI_SESSION_ID" > "$SESSION_FILE"; fi' EXIT INT TERM

# Check if session file exists to resume
if [ -f "$SESSION_FILE" ]; then
    SESSION_ID=$(cat "$SESSION_FILE")
    echo "Resuming Gemini session: $SESSION_ID"
    gemini chat --session-id "$SESSION_ID" --policy "$POLICY_FILE"
else
    echo "Starting new Gemini session..."
    gemini chat --policy "$POLICY_FILE"
fi
