#!/usr/bin/env bash
# Download and extract the latest Rabby release to ~/.cache/chrome-extensions/rabby/
# This is the directory `launch-chrome.sh` passes to `--load-extension`.

set -euo pipefail

CACHE_DIR="${HOME}/.cache/chrome-extensions"
TARGET="${CACHE_DIR}/rabby"

mkdir -p "${CACHE_DIR}"

echo "Fetching latest Rabby release URL…"
for tool in curl unzip node; do
  if ! command -v "${tool}" >/dev/null 2>&1; then
    echo "ERROR: \`${tool}\` is required but not found in PATH" >&2
    exit 1
  fi
done

# RabbyHub/Rabby is a public repo, so the unauthenticated GitHub REST API works
# (rate-limited but fine for one-shot use). gh CLI is optional; we use it when
# available to get a higher rate limit.
extract_zip_url_from_stdin() {
  node --input-type=module -e "
    const chunks = []
    for await (const c of process.stdin) chunks.push(c)
    const release = JSON.parse(Buffer.concat(chunks).toString())
    const zip = release.assets?.find((a) => a.name.endsWith('.zip'))
    process.stdout.write(zip ? zip.browser_download_url : '')
  "
}

if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  ZIP_URL="$(gh api repos/RabbyHub/Rabby/releases/latest --jq '.assets[] | select(.name | endswith(".zip")) | .browser_download_url' | head -1)"
else
  ZIP_URL="$(curl -fsSL https://api.github.com/repos/RabbyHub/Rabby/releases/latest | extract_zip_url_from_stdin)"
fi

if [[ -z "${ZIP_URL}" ]]; then
  echo "ERROR: could not resolve a .zip asset on the latest Rabby release" >&2
  exit 1
fi

echo "Downloading ${ZIP_URL}…"
TMP_ZIP="${CACHE_DIR}/rabby.zip"
# -f makes curl fail loudly on HTTP errors instead of saving an HTML error page
# (which would then break unzip with a confusing "End-of-central-directory" error).
curl -fsSL -o "${TMP_ZIP}" "${ZIP_URL}"

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
echo "  Version: $(node -p "require('${TARGET}/manifest.json').version")"
