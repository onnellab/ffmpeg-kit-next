#!/bin/bash

set -euo pipefail

if [[ $# -ne 4 ]]; then
  echo "usage: $0 <source-root> <temporary-source-root> <binary-bundle> <output-directory>" >&2
  exit 64
fi

source_root="$1"
temporary_source_root="$2"
binary_bundle="$3"
output_directory="$4"
script_directory="$(cd "$(dirname "$0")" && pwd)"
repository_root="$(cd "${script_directory}/../.." && pwd)"

components="ffmpeg lame libilbc libogg libsndfile libvorbis opencore-amr opus shine soxr speex twolame vo-amrwbenc"

[[ -d "${source_root}" ]] || {
  echo "error: source root not found: ${source_root}" >&2
  exit 1
}
[[ -d "${binary_bundle}" ]] || {
  echo "error: binary bundle not found: ${binary_bundle}" >&2
  exit 1
}
[[ -d "${temporary_source_root}" ]] || {
  echo "error: temporary source root not found: ${temporary_source_root}" >&2
  exit 1
}

rm -rf "${output_directory}"
mkdir -p "${output_directory}/sources" "${output_directory}/notices"
output_directory="$(cd "${output_directory}" && pwd)"
license_inventory="${output_directory}/SOURCE-LICENSE-INVENTORY.tsv"
printf 'component\tpath\n' > "${license_inventory}"

# shellcheck source=../../scripts/source.sh
source "${repository_root}/scripts/source.sh"

library_source_value() {
  set +u
  get_library_source "$1" "$2"
  set -u
}

archive_repository() {
  local name="$1"
  local path="$2"
  local expected_revision="$3"
  local expected_origin="$4"
  local inventory_pattern="${5:-(^|/)(COPYING|COPYRIGHT|LICENSE|LICENCE|NOTICE|PATENTS)(\.|$)}"
  local actual_revision
  local actual_origin

  [[ -e "${path}/.git" ]] || {
    echo "error: ${name} is not a git checkout: ${path}" >&2
    exit 1
  }

  actual_revision="$(git -C "${path}" rev-parse HEAD)"
  [[ "${actual_revision}" == "${expected_revision}" ]] || {
    echo "error: ${name} revision mismatch: expected ${expected_revision}, got ${actual_revision}" >&2
    exit 1
  }
  actual_origin="$(git -C "${path}" remote get-url origin | sed 's/\.git$//')"
  expected_origin="$(echo "${expected_origin}" | sed 's/\.git$//')"
  [[ "${actual_origin}" == "${expected_origin}" ]] || {
    echo "error: ${name} origin mismatch: expected ${expected_origin}, got ${actual_origin}" >&2
    exit 1
  }
  git -C "${path}" bundle create \
    "${output_directory}/sources/${name}-${actual_revision}.bundle" HEAD
  git -C "${path}" bundle verify \
    "${output_directory}/sources/${name}-${actual_revision}.bundle" >/dev/null

  license_paths="$(git -C "${path}" ls-tree -r --name-only HEAD | \
    grep -E "${inventory_pattern}" || true)"
  [[ -n "${license_paths}" ]] || {
    echo "error: ${name} contains no license or notice material" >&2
    exit 1
  }
  while IFS= read -r license_path; do
    printf '%s\t%s\n' "${name}" "${license_path}" >> "${license_inventory}"
    notice_destination="${output_directory}/notices/sources/${name}/${license_path}"
    mkdir -p "$(dirname "${notice_destination}")"
    git -C "${path}" show "HEAD:${license_path}" > "${notice_destination}"
  done <<< "${license_paths}"
}

main_revision="$(git -C "${repository_root}" rev-parse HEAD)"
archive_repository \
  "ffmpeg-kit-next" \
  "${repository_root}" \
  "${main_revision}" \
  "https://github.com/onnellab/ffmpeg-kit-next"

for component in ${components}; do
  component_revision="$(library_source_value "${component}" 2)"
  component_type="$(library_source_value "${component}" 3)"
  component_origin="$(library_source_value "${component}" 1)"
  [[ "${component_type}" == "COMMIT" ]] || {
    echo "error: ${component} is not pinned by immutable commit" >&2
    exit 1
  }
  archive_repository \
    "${component}" \
    "${source_root}/${component}" \
    "${component_revision}" \
    "${component_origin}"
done

archive_repository \
  "abseil-cpp" \
  "${source_root}/libilbc/abseil-cpp" \
  "1bae23e32ba1f1af7c7d1488a69a351ec96dc98d" \
  "https://github.com/arthenica/abseil-cpp"
archive_repository \
  "gnu-config" \
  "${temporary_source_root}/source/config" \
  "805517123cbfe33d17c989a18e78c5789fab0437" \
  "https://github.com/arthenica/gnu-config" \
  '(^|/)(config.guess|config.sub)$'
archive_repository \
  "gas-preprocessor" \
  "${temporary_source_root}/source/gas-preprocessor" \
  "d09971fad329d32df19f5bbafe88cf2f0ed04ed7" \
  "https://github.com/arthenica/gas-preprocessor" \
  '(^|/)gas-preprocessor.pl$'

reference_framework="${binary_bundle}/libavcodec.xcframework/ios-arm64/libavcodec.framework"
for notice in LICENSE LICENSE.* SOURCE; do
  for notice_path in "${reference_framework}"/${notice}; do
    [[ -f "${notice_path}" ]] || continue
    cp "${notice_path}" "${output_directory}/notices/$(basename "${notice_path}")"
  done
done
ffmpegkit_source="${binary_bundle}/ffmpegkit.xcframework/ios-arm64/ffmpegkit.framework/SOURCE"
[[ -s "${ffmpegkit_source}" ]] || {
  echo "error: FFmpegKit SOURCE notice missing" >&2
  exit 1
}
cp "${ffmpegkit_source}" "${output_directory}/notices/SOURCE.UPSTREAM"
cp "${repository_root}/tools/license/LICENSE.GPLv3" \
  "${output_directory}/notices/LICENSE.GPLv3"

required_notices="LICENSE LICENSE.GPLv3 LICENSE.LAME LICENSE.LIBILBC LICENSE.LIBOGG LICENSE.LIBSNDFILE LICENSE.LIBVORBIS LICENSE.OPENCORE-AMR LICENSE.OPUS LICENSE.SHINE LICENSE.SOXR LICENSE.SPEEX LICENSE.TWOLAME LICENSE.VO-AMRWBENC SOURCE.UPSTREAM"
for required_notice in ${required_notices}; do
  [[ -s "${output_directory}/notices/${required_notice}" ]] || {
    echo "error: required notice missing: ${required_notice}" >&2
    exit 1
  }
done

sed "s/\tSELF\t/\t${main_revision}\t/" \
  "${repository_root}/tools/apple/ios-audio-components.tsv" \
  > "${output_directory}/components.tsv"
cp "${repository_root}/tools/apple/IOS_AUDIO_SOURCE_OFFER.md" \
  "${output_directory}/SOURCE.md"
cp "${repository_root}/tools/apple/assemble-ios-audio-sources.sh" \
  "${output_directory}/assemble-sources.sh"
cp "${repository_root}/tools/apple/REBUILD_IOS_AUDIO.md" \
  "${output_directory}/REBUILD.md"
chmod +x "${output_directory}/assemble-sources.sh"

{
  echo "source_commit=${main_revision}"
  echo "binary_bundle=$(basename "${binary_bundle}")"
  echo "license_profile=LGPLv3"
  echo "gpl_nonfree_configuration=disabled"
  echo "ci_run_id=${GITHUB_RUN_ID:-local}"
  echo "ci_run_url=${GITHUB_SERVER_URL:-local}/${GITHUB_REPOSITORY:-local}/actions/runs/${GITHUB_RUN_ID:-local}"
  echo "build_command=./nix-ios.sh -p xcode26 -x --dsym --jobs=3 --target=12.1 --disable-arm64e --disable-arm64-mac-catalyst --disable-x86-64-mac-catalyst --enable-lame --enable-libilbc --enable-libvorbis --enable-opencore-amr --enable-opus --enable-shine --enable-soxr --enable-speex --enable-twolame --enable-vo-amrwbenc --enable-ios-zlib --enable-ios-libiconv"
} > "${output_directory}/BUILD-MANIFEST.txt"

printf 'framework\tslice\tarchitecture\tbinary_uuid\tdsym_uuid\n' \
  > "${output_directory}/UUID-MANIFEST.tsv"
for framework in ffmpegkit libavcodec libavdevice libavfilter libavformat libavutil libswresample libswscale; do
  for slice_path in "${binary_bundle}/${framework}.xcframework"/ios-*; do
    [[ -d "${slice_path}" ]] || continue
    binary="${slice_path}/${framework}.framework/${framework}"
    dsym="${slice_path}/dSYMs/${framework}.framework.dSYM"
    [[ -f "${binary}" && -d "${dsym}" ]] || {
      echo "error: binary or dSYM missing for ${framework} $(basename "${slice_path}")" >&2
      exit 1
    }
    while read -r uuid architecture; do
      dsym_uuid="$(dwarfdump --uuid "${dsym}" | awk -v arch="${architecture}" '$3 == "(" arch ")" {print tolower($2)}')"
      [[ "${uuid}" == "${dsym_uuid}" ]] || {
        echo "error: UUID mismatch for ${framework} ${architecture}" >&2
        exit 1
      }
      printf '%s\t%s\t%s\t%s\t%s\n' \
        "${framework}" "$(basename "${slice_path}")" "${architecture}" "${uuid}" "${dsym_uuid}" \
        >> "${output_directory}/UUID-MANIFEST.tsv"
    done < <(dwarfdump --uuid "${binary}" | awk '{print tolower($2), $3}' | tr -d '()')
  done
done

(cd "${output_directory}" && shasum -a 256 sources/*.bundle components.tsv SOURCE.md REBUILD.md assemble-sources.sh BUILD-MANIFEST.txt SOURCE-LICENSE-INVENTORY.tsv UUID-MANIFEST.tsv > SHA256SUMS)
while IFS= read -r notice_path; do
  relative_notice="${notice_path#${output_directory}/}"
  (cd "${output_directory}" && shasum -a 256 "${relative_notice}") >> "${output_directory}/SHA256SUMS"
done < <(find "${output_directory}/notices" -type f -print | LC_ALL=C sort)

echo "packaged immutable source and notice bundle at ${output_directory}"
