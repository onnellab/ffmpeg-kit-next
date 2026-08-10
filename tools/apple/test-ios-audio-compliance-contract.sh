#!/bin/bash

set -euo pipefail

script_directory="$(cd "$(dirname "$0")" && pwd)"
repository_root="$(cd "${script_directory}/../.." && pwd)"
manifest="${script_directory}/ios-audio-components.tsv"

# shellcheck source=../../scripts/source.sh
source "${repository_root}/scripts/source.sh"

library_source_value() {
  set +u
  get_library_source "$1" "$2"
  set -u
}

expected_components="ffmpeg lame libilbc libogg libsndfile libvorbis opencore-amr opus shine soxr speex twolame vo-amrwbenc"
actual_components="$(sed -n '3,15p' "${manifest}" | cut -f1 | paste -sd ' ' -)"
[[ "${actual_components}" == "${expected_components}" ]] || {
  echo "error: compliance component closure changed: ${actual_components}" >&2
  exit 1
}

while IFS=$'\t' read -r component source_url revision license; do
  [[ "${component}" == "component" ]] && continue
  [[ -n "${component}" && -n "${source_url}" && -n "${revision}" && -n "${license}" ]] || {
    echo "error: incomplete compliance row for ${component}" >&2
    exit 1
  }

  if [[ "${component}" == "ffmpeg-kit-next" ]]; then
    [[ "${revision}" == "SELF" ]] || {
      echo "error: repository revision must be resolved at packaging time" >&2
      exit 1
    }
    continue
  fi

  if [[ "${component}" == "abseil-cpp" ]]; then
    [[ "${source_url}" == "https://github.com/arthenica/abseil-cpp" ]]
    [[ "${revision}" == "1bae23e32ba1f1af7c7d1488a69a351ec96dc98d" ]]
    continue
  fi
  if [[ "${component}" == "gnu-config" ]]; then
    [[ "$(library_source_value config 1)" == "${source_url}" ]]
    [[ "$(library_source_value config 2)" == "${revision}" ]]
    [[ "$(library_source_value config 3)" == "COMMIT" ]]
    continue
  fi
  if [[ "${component}" == "gas-preprocessor" ]]; then
    [[ "$(library_source_value gas-preprocessor 1)" == "${source_url}" ]]
    [[ "$(library_source_value gas-preprocessor 2)" == "${revision}" ]]
    [[ "$(library_source_value gas-preprocessor 3)" == "COMMIT" ]]
    [[ "${license}" == "GPL-2.0-or-later" ]]
    continue
  fi

  [[ "$(library_source_value "${component}" 1)" == "${source_url}" ]] || {
    echo "error: ${component} source URL drift" >&2
    exit 1
  }
  [[ "$(library_source_value "${component}" 2)" == "${revision}" ]] || {
    echo "error: ${component} revision drift" >&2
    exit 1
  }
  [[ "$(library_source_value "${component}" 3)" == "COMMIT" ]] || {
    echo "error: ${component} must be pinned to an immutable commit" >&2
    exit 1
  }
done < "${manifest}"

grep -q 'same GitHub release page' "${script_directory}/IOS_AUDIO_SOURCE_OFFER.md"
grep -q 'reverse engineer' "${script_directory}/IOS_AUDIO_SOURCE_OFFER.md"

echo "verified immutable iOS audio source and notice contract"
