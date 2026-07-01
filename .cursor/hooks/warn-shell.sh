#!/usr/bin/env bash
set -euo pipefail

input_json="$(cat)"

command_text="$(
python3 - <<'PY' "$input_json"
import json
import sys

raw = sys.argv[1]
try:
    data = json.loads(raw)
except Exception:
    print("")
    raise SystemExit(0)

print(data.get("command", ""))
PY
)"

dangerous_regex='git[[:space:]]+reset[[:space:]]+--hard|git[[:space:]]+clean[[:space:]]+-fd|rm[[:space:]]+-rf[[:space:]]+/|rm[[:space:]]+-rf[[:space:]]+\.|:\(\)\{[[:space:]]*:\|:[[:space:]]*&[[:space:]]*\};:'
network_regex='curl[[:space:]]|wget[[:space:]]|scp[[:space:]]|ssh[[:space:]]'

category="general"
if [[ "$command_text" =~ $dangerous_regex ]]; then
  category="dangerous-shell-command"
elif [[ "$command_text" =~ $network_regex ]]; then
  category="network-shell-command"
fi

if [[ "$category" != "general" ]]; then
  printf "Cursor hook warning (%s): %s\n" "$category" "$command_text" >&2
fi

printf '{"continue": true}\n'
