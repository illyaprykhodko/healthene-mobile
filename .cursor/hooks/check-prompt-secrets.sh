#!/usr/bin/env bash
set -euo pipefail

input_json="$(cat)"

prompt_text="$(
python3 - <<'PY' "$input_json"
import json
import sys

raw = sys.argv[1]
try:
    data = json.loads(raw)
except Exception:
    print("")
    raise SystemExit(0)

print(data.get("prompt", ""))
PY
)"

# Allow explicit bypass for rare valid cases.
if [[ "$prompt_text" == *"[allow-secrets]"* ]]; then
  printf '{"continue": true}\n'
  exit 0
fi

secret_regex='(-----BEGIN [A-Z ]*PRIVATE KEY-----|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|xox[baprs]-[0-9A-Za-z-]+|ghp_[0-9A-Za-z]{36}|(api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)[[:space:]]*[:=][[:space:]]*[A-Za-z0-9_\-\/\+=]{8,})'

if echo "$prompt_text" | grep -Eqi "$secret_regex"; then
  printf "Cursor hook warning: prompt may contain a secret\n" >&2
fi

printf '{"continue": true}\n'
