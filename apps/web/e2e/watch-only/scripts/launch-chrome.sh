#!/usr/bin/env bash
# Launch Chrome for Testing with Rabby loaded and remote debugging on port 9223.
#
# Stable Google Chrome 130+ silently rejects --load-extension, so we use the
# puppeteer-shipped variant. The binary lives in the puppeteer cache after a
# successful `yarn install`.

set -euo pipefail

PROFILE_DIR="${HOME}/.cache/chrome-rabby-profile"
EXT_DIR="${HOME}/.cache/chrome-extensions/rabby"
DEBUG_PORT="${DEBUG_PORT:-9223}"

if [[ ! -d "${EXT_DIR}" ]]; then
  echo "ERROR: Rabby is not installed at ${EXT_DIR}" >&2
  echo "  Run apps/web/e2e/watch-only/scripts/fetch-rabby.sh first." >&2
  exit 1
fi

# Pick the most recent Chrome for Testing in puppeteer's cache
PUPPETEER_CACHE="${HOME}/.cache/puppeteer/chrome"
if [[ ! -d "${PUPPETEER_CACHE}" ]]; then
  echo "ERROR: puppeteer cache not found at ${PUPPETEER_CACHE}" >&2
  echo "  Run \`yarn install\` from the repo root to populate it." >&2
  exit 1
fi

CFT_DIR="$(ls -1d "${PUPPETEER_CACHE}"/mac_arm-* 2>/dev/null | sort -V | tail -1)"
if [[ -z "${CFT_DIR}" ]]; then
  echo "ERROR: no Chrome for Testing variant in ${PUPPETEER_CACHE}" >&2
  exit 1
fi

CFT_BIN="${CFT_DIR}/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
if [[ ! -x "${CFT_BIN}" ]]; then
  echo "ERROR: ${CFT_BIN} not found or not executable" >&2
  exit 1
fi

# Nothing running on the debug port?
if lsof -ti ":${DEBUG_PORT}" >/dev/null 2>&1; then
  echo "Port ${DEBUG_PORT} is busy. Killing existing Chrome for Testing…"
  pkill -f "chrome-rabby-profile" 2>/dev/null || true
  sleep 2
fi

# Ensure profile dir exists (Rabby state lives here after onboarding)
mkdir -p "${PROFILE_DIR}"

echo "Launching Chrome for Testing…"
echo "  binary:  ${CFT_BIN}"
echo "  profile: ${PROFILE_DIR}"
echo "  rabby:   ${EXT_DIR}"
echo "  CDP:     http://localhost:${DEBUG_PORT}"

# nohup so this survives the parent shell exiting
nohup "${CFT_BIN}" \
  --user-data-dir="${PROFILE_DIR}" \
  --load-extension="${EXT_DIR}" \
  --remote-debugging-port="${DEBUG_PORT}" \
  --no-first-run \
  --no-default-browser-check \
  >/tmp/chrome-rabby.log 2>&1 &
disown

# Wait for CDP to come up
for i in $(seq 1 20); do
  if curl -sf "http://localhost:${DEBUG_PORT}/json/version" >/dev/null; then
    echo "✓ CDP up at http://localhost:${DEBUG_PORT}"
    exit 0
  fi
  sleep 0.5
done

echo "ERROR: Chrome for Testing did not expose CDP on port ${DEBUG_PORT}" >&2
echo "  tail /tmp/chrome-rabby.log for details" >&2
exit 1
