#!/bin/bash

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: $0 <destination>" >&2
  exit 64
fi

bundle_root="$(cd "$(dirname "$0")" && pwd)"
destination="$1"
mkdir -p "${destination}"
destination="$(cd "${destination}" && pwd)"

component_revision() {
  awk -F '\t' -v name="$1" '$1 == name { print $3 }' "${bundle_root}/components.tsv"
}

clone_component() {
  local component="$1"
  local target="$2"
  local revision
  local bundle
  revision="$(component_revision "${component}")"
  [[ -n "${revision}" ]] || {
    echo "error: revision missing for ${component}" >&2
    exit 1
  }
  bundle="${bundle_root}/sources/${component}-${revision}.bundle"
  [[ -s "${bundle}" ]] || {
    echo "error: source bundle missing for ${component}" >&2
    exit 1
  }
  [[ ! -e "${target}" ]] || {
    echo "error: assembly target already exists: ${target}" >&2
    exit 1
  }
  git clone -q "${bundle}" "${target}"
  [[ "$(git -C "${target}" rev-parse HEAD)" == "${revision}" ]] || {
    echo "error: assembled revision mismatch for ${component}" >&2
    exit 1
  }
}

clone_component "ffmpeg-kit-next" "${destination}/ffmpeg-kit-next"
root="${destination}/ffmpeg-kit-next"
mkdir -p "${root}/src" "${root}/.tmp/source"

for component in ffmpeg lame libilbc libogg libsndfile libvorbis opencore-amr opus shine soxr speex twolame vo-amrwbenc; do
  clone_component "${component}" "${root}/src/${component}"
done

git -C "${root}/src/libilbc" submodule init
git -C "${root}/src/libilbc" config submodule.abseil.url \
  "${bundle_root}/sources/abseil-cpp-$(component_revision abseil-cpp).bundle"
git -c protocol.file.allow=always -C "${root}/src/libilbc" submodule update --init
[[ "$(git -C "${root}/src/libilbc/abseil-cpp" rev-parse HEAD)" == "$(component_revision abseil-cpp)" ]]

clone_component "gnu-config" "${root}/.tmp/source/config"
clone_component "gas-preprocessor" "${root}/.tmp/source/gas-preprocessor"

echo "assembled build-ready sources at ${root}"
