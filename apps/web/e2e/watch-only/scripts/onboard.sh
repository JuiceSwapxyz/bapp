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
# Export so child processes (curl invocations below + the node helper) see the
# same effective value regardless of whether the caller set it.
export DEBUG_PORT="${DEBUG_PORT:-9223}"
RABBY_ID="acmacodkjbdgmoleebolmdjonilkdbch"

# Ensure Chrome is running
if ! curl -sf "http://localhost:${DEBUG_PORT}/json/version" >/dev/null; then
  echo "Chrome is not up — launching it first."
  "${SCRIPT_DIR}/launch-chrome.sh"
fi

# Open the Rabby UI tab if not present
if ! curl -s "http://localhost:${DEBUG_PORT}/json/list" | grep -q "${RABBY_ID}/index.html"; then
  echo "Opening Rabby UI tab…"
  curl -s -X PUT "http://localhost:${DEBUG_PORT}/json/new?chrome-extension://${RABBY_ID}/index.html#/welcome" >/dev/null
  sleep 2
fi

# Drive the onboarding via the node helper. WATCH_ADDR + PASSWORD are inherited
# from the calling shell (bash auto-exports `VAR=val cmd` assignments for cmd's
# lifetime); DEBUG_PORT is exported explicitly above.
exec node "${SCRIPT_DIR}/../helpers/onboard.mjs"
