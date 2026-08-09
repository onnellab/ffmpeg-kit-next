#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fixture_root="$(mktemp -d)"
trap 'rm -rf "${fixture_root}"' EXIT

export BASEDIR="${repo_root}"
export version_config=""
# shellcheck source=scripts/function.sh
source "${repo_root}/scripts/function.sh"
export BASEDIR="${fixture_root}"

write_major_header() {
  local library_name="$1"
  local macro_name="$2"
  local major_value="$3"
  local header_name="version_major.h"

  if [[ "${library_name}" == "libavutil" ]]; then
    header_name="version.h"
  fi
  mkdir -p "${fixture_root}/src/ffmpeg/${library_name}"
  printf '#define %s %s\n' "${macro_name}" "${major_value}" > \
    "${fixture_root}/src/ffmpeg/${library_name}/${header_name}"
}

write_major_header libavcodec LIBAVCODEC_VERSION_MAJOR 62
write_major_header libavdevice LIBAVDEVICE_VERSION_MAJOR 62
write_major_header libavfilter LIBAVFILTER_VERSION_MAJOR 11
write_major_header libavformat LIBAVFORMAT_VERSION_MAJOR 62
write_major_header libavutil LIBAVUTIL_VERSION_MAJOR 60
write_major_header libswresample LIBSWRESAMPLE_VERSION_MAJOR 6
write_major_header libswscale LIBSWSCALE_VERSION_MAJOR 9

expected_pairs=(
  libavcodec:62
  libavdevice:62
  libavfilter:11
  libavformat:62
  libavutil:60
  libswresample:6
  libswscale:9
)

for expected_pair in "${expected_pairs[@]}"; do
  library_name="${expected_pair%%:*}"
  expected_major="${expected_pair#*:}"
  actual_major="$(get_ffmpeg_library_major_version "${library_name}")"
  if [[ "${actual_major}" != "${expected_major}" ]]; then
    echo "Unexpected ${library_name} major: expected ${expected_major}, got ${actual_major}" >&2
    exit 1
  fi
done
