#!/bin/bash
# PreToolUse hook (Bash): block obviously destructive shell commands (defense-in-depth on top of the
# deny list in .claude/settings.json). Claude Code passes the command under .tool_input.command;
# exit 2 blocks the call and feeds stderr back to Claude. Requires `jq` (no-op if jq is missing).
# Adapted from intelliceed/ai-meta (upstream read top-level .command; Claude Code nests under tool_input).

input=$(cat)
command=$(printf '%s' "$input" | jq -r '.tool_input.command // ""' 2>/dev/null || echo "")

[[ -z "$command" ]] && exit 0

patterns=(
  'rm\s+-rf?\s+/'      # rm -rf / (and rm -r /)
  'rm\s+-rf?\s+\*'     # rm -rf *
  ':\(\)\s*\{.*\}'     # fork bomb
  'mkfs\.'             # format filesystem
  'dd\s+if=.*of=/dev'  # overwrite disk device
  '>\s*/dev/sd[a-z]'   # redirect over a block device
)

for pattern in "${patterns[@]}"; do
  if echo "$command" | grep -qiE "$pattern"; then
    echo "check-command: dangerous command blocked — review before running" >&2
    exit 2
  fi
done

exit 0
