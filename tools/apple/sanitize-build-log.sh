#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 INPUT OUTPUT" >&2
  exit 2
fi

input_path="$1"
output_path="$2"

if [[ ! -f "${input_path}" ]]; then
  echo "Build log not found: ${input_path}" >&2
  exit 1
fi

awk '
  /INFO: Building .* with the following environment variables/ {
    print
    print "[environment omitted]"
    omit_environment = 1
    next
  }
  omit_environment && /^-+$/ {
    omit_environment = 0
    print
    next
  }
  !omit_environment { print }
' "${input_path}" > "${output_path}"
