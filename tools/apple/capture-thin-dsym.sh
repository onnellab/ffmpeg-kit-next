#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 BINARY OUTPUT_DSYM" >&2
  exit 2
fi

binary_path="$1"
output_dsym="$2"

if [[ ! -f "${binary_path}" ]]; then
  echo "Binary not found: ${binary_path}" >&2
  exit 1
fi

rm -rf "${output_dsym}"
mkdir -p "$(dirname "${output_dsym}")"
dsymutil_output="$(xcrun dsymutil "${binary_path}" -o "${output_dsym}" 2>&1)" || {
  printf '%s\n' "${dsymutil_output}" >&2
  exit 1
}
printf '%s\n' "${dsymutil_output}"

if grep -qi 'warning:' <<<"${dsymutil_output}"; then
  echo "Thin dSYM generation reported an unresolved debug-map warning: ${binary_path}" >&2
  exit 1
fi

binary_uuids="$(xcrun dwarfdump --uuid "${binary_path}" | awk '{print $2}' | LC_ALL=C sort)"
dsym_uuids="$(xcrun dwarfdump --uuid "${output_dsym}" | awk '{print $2}' | LC_ALL=C sort)"

if [[ -z "${binary_uuids}" || "${binary_uuids}" != "${dsym_uuids}" ]]; then
  echo "Thin dSYM UUID mismatch: binary=${binary_uuids} dSYM=${dsym_uuids}" >&2
  exit 1
fi

for binary_arch in $(lipo -archs "${binary_path}"); do
  if ! xcrun dwarfdump --arch="${binary_arch}" --debug-info "${output_dsym}" |
    awk '/DW_TAG_compile_unit/{found=1} END {exit(found ? 0 : 1)}'; then
    echo "Thin dSYM contains no DWARF compile units for ${binary_arch}: ${binary_path}" >&2
    exit 1
  fi

  if ! xcrun dwarfdump --arch="${binary_arch}" --debug-line "${output_dsym}" |
    awk '/file_names\[/{found=1} END {exit(found ? 0 : 1)}'; then
    echo "Thin dSYM contains no line table for ${binary_arch}: ${binary_path}" >&2
    exit 1
  fi
done
