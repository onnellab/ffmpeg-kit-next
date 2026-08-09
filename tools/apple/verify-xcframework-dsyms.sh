#!/bin/bash

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: $0 <xcframework-directory>" >&2
  exit 64
fi

bundle_dir="$1"
expected_frameworks="ffmpegkit libavcodec libavdevice libavfilter libavformat libavutil libswresample libswscale"
expected_audio_licenses="LICENSE.LAME
LICENSE.LIBILBC
LICENSE.LIBOGG
LICENSE.LIBSNDFILE
LICENSE.LIBVORBIS
LICENSE.OPENCORE-AMR
LICENSE.OPUS
LICENSE.SHINE
LICENSE.SOXR
LICENSE.SPEEX
LICENSE.TWOLAME
LICENSE.VO-AMRWBENC"
verified_count=0

if [[ ! -d "${bundle_dir}" ]]; then
  echo "error: XCFramework directory not found: ${bundle_dir}" >&2
  exit 1
fi

uuid_list() {
  xcrun dwarfdump --uuid "$1" | awk '{print $2}' | LC_ALL=C sort
}

for framework_name in ${expected_frameworks}; do
  xcframework="${bundle_dir}/${framework_name}.xcframework"
  info_plist="${xcframework}/Info.plist"
  slice_count=0
  saw_device=0
  saw_simulator=0

  if [[ ! -f "${info_plist}" ]]; then
    echo "error: missing ${framework_name}.xcframework/Info.plist" >&2
    exit 1
  fi

  while IFS= read -r framework; do
    slice_dir="$(dirname "${framework}")"
    binary="${framework}/${framework_name}"
    dsym="${slice_dir}/dSYMs/${framework_name}.framework.dSYM"

    if [[ ! -f "${binary}" ]]; then
      echo "error: missing framework binary: ${binary}" >&2
      exit 1
    fi
    if [[ ! -d "${dsym}" ]]; then
      echo "error: missing dSYM for ${binary}" >&2
      exit 1
    fi

    binary_uuids="$(uuid_list "${binary}")"
    dsym_uuids="$(uuid_list "${dsym}")"
    if [[ -z "${binary_uuids}" ]] || [[ "${binary_uuids}" != "${dsym_uuids}" ]]; then
      echo "error: UUID mismatch for ${binary}" >&2
      echo "binary: ${binary_uuids}" >&2
      echo "dSYM:   ${dsym_uuids}" >&2
      exit 1
    fi
    for binary_arch in $(lipo -archs "${binary}"); do
      if ! xcrun dwarfdump --arch="${binary_arch}" --debug-info "${dsym}" | awk '/DW_TAG_compile_unit/{found=1} END {exit(found ? 0 : 1)}'; then
        echo "error: no DWARF compile unit for ${binary_arch} in ${dsym}" >&2
        exit 1
      fi
    done

    build_info="$(xcrun vtool -show-build "${binary}")"
    if echo "${build_info}" | grep -Eq 'platform +IOSSIMULATOR([[:space:]]|$)'; then
      simulator_arches="$(lipo -archs "${binary}")"
      if [[ " ${simulator_arches} " != *" arm64 "* ]] || [[ " ${simulator_arches} " != *" x86_64 "* ]]; then
        echo "error: ${framework_name} simulator slice must contain arm64 and x86_64: ${simulator_arches}" >&2
        exit 1
      fi
      saw_simulator=1
    elif echo "${build_info}" | grep -Eq 'platform +IOS([[:space:]]|$)'; then
      if [[ "$(lipo -archs "${binary}")" != "arm64" ]]; then
        echo "error: ${framework_name} device slice is not arm64-only" >&2
        exit 1
      fi
      saw_device=1
    else
      echo "error: unexpected Apple platform for ${binary}" >&2
      exit 1
    fi

    if [[ "${framework_name}" == "libavcodec" ]]; then
      actual_audio_licenses="$(find "${framework}" -type f -name 'LICENSE.*' -exec basename {} \; | LC_ALL=C sort -u)"
      if [[ "${actual_audio_licenses}" != "${expected_audio_licenses}" ]]; then
        echo "error: audio library/license allowlist drift in ${framework}" >&2
        echo "expected:" >&2
        echo "${expected_audio_licenses}" >&2
        echo "actual:" >&2
        echo "${actual_audio_licenses}" >&2
        exit 1
      fi
    fi

    slice_count=$((slice_count + 1))
  done < <(find "${xcframework}" -mindepth 2 -maxdepth 2 -type d -name "${framework_name}.framework" | LC_ALL=C sort)

  if [[ ${slice_count} -ne 2 ]] || [[ ${saw_device} -ne 1 ]] || [[ ${saw_simulator} -ne 1 ]]; then
    echo "error: ${framework_name} must contain exactly one iOS device and one simulator slice" >&2
    exit 1
  fi

  for library_index in 0 1; do
    if ! /usr/libexec/PlistBuddy -c "Print :AvailableLibraries:${library_index}:DebugSymbolsPath" "${info_plist}" >/dev/null 2>&1; then
      echo "error: ${framework_name} Info.plist slice ${library_index} has no DebugSymbolsPath" >&2
      exit 1
    fi
  done

  verified_count=$((verified_count + 1))
done

actual_count="$(find "${bundle_dir}" -mindepth 1 -maxdepth 1 -type d -name '*.xcframework' | wc -l | tr -d ' ')"
if [[ "${actual_count}" -ne ${verified_count} ]]; then
  echo "error: unexpected XCFramework count: expected ${verified_count}, found ${actual_count}" >&2
  exit 1
fi

echo "verified ${verified_count} XCFrameworks with UUID-matched, non-empty dSYMs"
