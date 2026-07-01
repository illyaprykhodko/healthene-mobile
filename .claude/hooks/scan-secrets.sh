#!/bin/bash
# PreToolUse hook (Edit|Write): block hardcoded secrets before they are written.
# Claude Code passes tool params under .tool_input; exit 2 blocks the tool call and
# feeds stderr back to Claude. Requires `jq` (no-op if jq is missing).
# Adapted from intelliceed/ai-meta (upstream read top-level keys; Claude Code nests under tool_input).

input=$(cat)
content=$(printf '%s' "$input" | jq -r '(.tool_input.new_string // .tool_input.content) // ""' 2>/dev/null || echo "")

[[ -z "$content" ]] && exit 0

patterns=(
  'AKIA[0-9A-Z]{16}'                                              # AWS access key id
  'sk-[a-zA-Z0-9]{32,}'                                          # OpenAI / Anthropic style key
  'ghp_[a-zA-Z0-9]{36}'                                          # GitHub personal token
  'glpat-[a-zA-Z0-9_-]{20}'                                      # GitLab personal token
  'https://[0-9a-f]+@[a-z0-9.-]*sentry\.io'                      # Sentry DSN with secret
  '(password|passwd|pwd)\s*[:=]\s*["'"'"'][^"'"'"']{4,}["'"'"']' # hardcoded password
  '(secret|api_?key|token)\s*[:=]\s*["'"'"'][^"'"'"']{8,}["'"'"']' # hardcoded secret/token/api key
)

for pattern in "${patterns[@]}"; do
  if echo "$content" | grep -qiE "$pattern"; then
    echo "scan-secrets: possible hardcoded secret detected — review before writing (PHI app: secrets belong in .env*/Keychain)" >&2
    exit 2
  fi
done

exit 0
