#!/usr/bin/env bash
# Run Rabby through first-time setup and add a watch-only address.
#
# Required env:
#   WATCH_ADDR   the address to track (0x-prefixed checksummed)
#
# Optional env:
#   PASSWORD     Rabby unlock password (default: TestPass123!)
#   DEBUG_PORT   CDP port (default: 9223)

set -euo pipefail

if [[ -z "${WATCH_ADDR:-}" ]]; then
  echo "ERROR: WATCH_ADDR is required" >&2
  echo "  WATCH_ADDR=0x… $0" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Ensure Chrome is running
if ! curl -sf "http://localhost:${DEBUG_PORT:-9223}/json/version" >/dev/null; then
  echo "Chrome is not up — launching it first."
  "${SCRIPT_DIR}/launch-chrome.sh"
fi

# Open the Rabby UI tab if not present
RABBY_ID="acmacodkjbdgmoleebolmdjonilkdbch"
PORT="${DEBUG_PORT:-9223}"
if ! curl -s "http://localhost:${PORT}/json/list" | grep -q "${RABBY_ID}/index.html"; then
  echo "Opening Rabby UI tab…"
  curl -s -X PUT "http://localhost:${PORT}/json/new?chrome-extension://${RABBY_ID}/index.html#/welcome" >/dev/null
  sleep 2
fi

# Drive the onboarding via the node helper
exec node "${SCRIPT_DIR}/../helpers/onboard.mjs"
