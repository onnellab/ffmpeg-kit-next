#!/usr/bin/env bash

set -euo pipefail

if [[ $# -lt 4 ]]; then
  echo "Usage: $0 BINARY OUTPUT_DSYM DWARF_NAME THIN_DSYM..." >&2
  exit 2
fi

binary_path="$1"
output_dsym="$2"
dwarf_name="$3"
shift 3

rm -rf "${output_dsym}"
mkdir -p "${output_dsym}/Contents/Resources/DWARF"

dwarf_inputs=()
first_info_plist=""
for thin_dsym in "$@"; do
  if [[ ! -d "${thin_dsym}" ]]; then
    echo "Thin dSYM not found: ${thin_dsym}" >&2
    exit 1
  fi

  thin_dwarf=""
  for dwarf_candidate in "${thin_dsym}/Contents/Resources/DWARF/"*; do
    if [[ -f "${dwarf_candidate}" ]]; then
      if [[ -n "${thin_dwarf}" ]]; then
        echo "Thin dSYM has multiple DWARF payloads: ${thin_dsym}" >&2
        exit 1
      fi
      thin_dwarf="${dwarf_candidate}"
    fi
  done
  if [[ -z "${thin_dwarf}" ]]; then
    echo "Thin dSYM has no DWARF payload: ${thin_dsym}" >&2
    exit 1
  fi
  dwarf_inputs+=("${thin_dwarf}")
  if [[ -z "${first_info_plist}" ]]; then
    first_info_plist="${thin_dsym}/Contents/Info.plist"
  fi
done

cp "${first_info_plist}" "${output_dsym}/Contents/Info.plist"
if ! /usr/libexec/PlistBuddy -c "Set :CFBundleExecutable ${dwarf_name}" "${output_dsym}/Contents/Info.plist" >/dev/null 2>&1; then
  /usr/libexec/PlistBuddy -c "Add :CFBundleExecutable string ${dwarf_name}" "${output_dsym}/Contents/Info.plist"
fi
if ! /usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier com.apple.xcode.dsym.${dwarf_name}" "${output_dsym}/Contents/Info.plist" >/dev/null 2>&1; then
  /usr/libexec/PlistBuddy -c "Add :CFBundleIdentifier string com.apple.xcode.dsym.${dwarf_name}" "${output_dsym}/Contents/Info.plist"
fi
lipo -create "${dwarf_inputs[@]}" -output "${output_dsym}/Contents/Resources/DWARF/${dwarf_name}"

binary_uuids="$(xcrun dwarfdump --uuid "${binary_path}" | awk '{print $2}' | LC_ALL=C sort)"
dsym_uuids="$(xcrun dwarfdump --uuid "${output_dsym}" | awk '{print $2}' | LC_ALL=C sort)"

if [[ -z "${binary_uuids}" || "${binary_uuids}" != "${dsym_uuids}" ]]; then
  echo "Merged dSYM UUID mismatch: binary=${binary_uuids} dSYM=${dsym_uuids}" >&2
  exit 1
fi

for binary_arch in $(lipo -archs "${binary_path}"); do
  if ! xcrun dwarfdump --arch="${binary_arch}" --debug-info "${output_dsym}" |
    awk '/DW_TAG_compile_unit/{found=1} END {exit(found ? 0 : 1)}'; then
    echo "Merged dSYM contains no DWARF compile units for ${binary_arch}: ${binary_path}" >&2
    exit 1
  fi

  symbolicated=0
  while read -r symbol_address symbol_kind symbol_name; do
    if [[ "${symbol_kind}" != "T" || -z "${symbol_address}" ]]; then
      continue
    fi
    if xcrun dwarfdump --arch="${binary_arch}" --lookup "0x${symbol_address}" "${output_dsym}" 2>/dev/null |
      grep -Eq 'Line info: file .+, line [1-9][0-9]*'; then
      echo "Verified ${binary_arch} file:line symbolication for ${symbol_name}"
      symbolicated=1
      break
    fi
  done < <(xcrun nm -arch "${binary_arch}" -n "${binary_path}")

  if [[ ${symbolicated} -ne 1 ]]; then
    echo "Merged dSYM cannot symbolicate any exported text symbol to file:line for ${binary_arch}: ${binary_path}" >&2
    exit 1
  fi
done
