#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fixture_root="$(mktemp -d)"
trap 'rm -rf "${fixture_root}"' EXIT

export BASEDIR="${repo_root}"
export FFMPEG_KIT_TMPDIR="${fixture_root}/tmp"
export REDOWNLOAD_config=0
export version_config=""
mkdir -p "${FFMPEG_KIT_TMPDIR}/source"

# shellcheck source=scripts/function.sh
source "${repo_root}/scripts/function.sh"

config_repo="$(get_library_source config 1)"
config_commit="$(get_library_source config 2)"
export BASEDIR="${fixture_root}"

clone_git_repository_with_tag() {
  printf 'tag:%s|%s|%s\n' "$1" "$2" "$3" > "${fixture_root}/route"
  echo 0
}

clone_git_repository_with_commit_id() {
  printf 'commit:%s|%s|%s\n' "$1" "$2" "$3" > "${fixture_root}/route"
  echo 0
}

download_gnu_config

config_path="${FFMPEG_KIT_TMPDIR}/source/config"
if [[ "$(<"${fixture_root}/route")" != "commit:${config_repo}|${config_path}|${config_commit}" ]]; then
  echo "GNU config did not use its immutable commit source" >&2
  exit 1
fi

get_library_source() {
  case "$2" in
    1) echo "https://example.invalid/config.git" ;;
    2) echo "synthetic-tag" ;;
    3) echo "TAG" ;;
  esac
}

download_gnu_config

if [[ "$(<"${fixture_root}/route")" != "tag:https://example.invalid/config.git|synthetic-tag|${config_path}" ]]; then
  echo "GNU config did not preserve tag source routing" >&2
  exit 1
fi
