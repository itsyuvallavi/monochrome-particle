#!/usr/bin/env bash
set -euo pipefail

# Install Monochrome Particle skill from a local clone of this repo.
# Usage:
#   ./install.sh           -> ~/.cursor/skills/monochrome-particle
#   ./install.sh project   -> ./.cursor/skills/monochrome-particle

MODE="${1:-user}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="${ROOT}/skills/monochrome-particle"

if [[ ! -f "${SRC}/SKILL.md" ]]; then
  echo "error: missing ${SRC}/SKILL.md (run from repo root)" >&2
  exit 1
fi

if [[ "${MODE}" == "project" ]]; then
  DEST="${PWD}/.cursor/skills/monochrome-particle"
else
  DEST="${HOME}/.cursor/skills/monochrome-particle"
fi

mkdir -p "${DEST}"
cp -R "${SRC}/." "${DEST}/"
echo "Installed Monochrome Particle skill to: ${DEST}"
