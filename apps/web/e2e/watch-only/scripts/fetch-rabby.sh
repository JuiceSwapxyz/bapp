#!/usr/bin/env bash
# Download and extract the latest Rabby release to ~/.cache/chrome-extensions/rabby/
# This is the directory `launch-chrome.sh` passes to `--load-extension`.

set -euo pipefail

CACHE_DIR="${HOME}/.cache/chrome-extensions"
TARGET="${CACHE_DIR}/rabby"

mkdir -p "${CACHE_DIR}"

echo "Fetching latest Rabby release URL…"
if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: gh CLI is required" >&2
  echo "       brew install gh && gh auth login" >&2
  exit 1
fi
if ! command -v unzip >/dev/null 2>&1; then
  echo "ERROR: unzip is required (macOS ships it; install Xcode CLT if missing)" >&2
  exit 1
fi
if ! gh auth status >/dev/null 2>&1; then
  echo "ERROR: gh is not authenticated — run \`gh auth login\` first" >&2
  exit 1
fi

ZIP_URL="$(gh api repos/RabbyHub/Rabby/releases/latest --jq '.assets[] | select(.name | endswith(".zip")) | .browser_download_url' | head -1)"

if [[ -z "${ZIP_URL}" ]]; then
  echo "ERROR: could not resolve a .zip asset on the latest Rabby release" >&2
  exit 1
fi

echo "Downloading ${ZIP_URL}…"
TMP_ZIP="${CACHE_DIR}/rabby.zip"
curl -sSL -o "${TMP_ZIP}" "${ZIP_URL}"

echo "Extracting to ${TARGET}…"
rm -rf "${TARGET}"
mkdir -p "${TARGET}"
unzip -q "${TMP_ZIP}" -d "${TARGET}"
rm "${TMP_ZIP}"

# Sanity check
if [[ ! -f "${TARGET}/manifest.json" ]]; then
  echo "ERROR: manifest.json missing — the zip layout changed?" >&2
  exit 1
fi

echo "✓ Rabby unpacked at ${TARGET}"
echo "  Version: $(python3 -c "import json; print(json.load(open('${TARGET}/manifest.json'))['version'])")"
