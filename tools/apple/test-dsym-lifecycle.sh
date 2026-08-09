#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fixture_root="$(mktemp -d)"
trap 'rm -rf "${fixture_root}"' EXIT

cat > "${fixture_root}/fixture.c" <<'EOF'
int melivra_dsym_fixture(int value) { return value + 7; }
EOF

for fixture_arch in arm64 x86_64; do
  xcrun clang -arch "${fixture_arch}" -g -O2 -c \
    "${fixture_root}/fixture.c" -o "${fixture_root}/fixture-${fixture_arch}.o"
  xcrun clang -arch "${fixture_arch}" -dynamiclib \
    "${fixture_root}/fixture-${fixture_arch}.o" -o "${fixture_root}/libfixture-${fixture_arch}"

  "${repo_root}/tools/apple/capture-thin-dsym.sh" \
    "${fixture_root}/libfixture-${fixture_arch}" \
    "${fixture_root}/libfixture-${fixture_arch}.dSYM"

  xcrun strip -x "${fixture_root}/libfixture-${fixture_arch}"
  rm "${fixture_root}/fixture-${fixture_arch}.o"
done

lipo -create \
  "${fixture_root}/libfixture-arm64" \
  "${fixture_root}/libfixture-x86_64" \
  -output "${fixture_root}/libfixture"

"${repo_root}/tools/apple/merge-thin-dsyms.sh" \
  "${fixture_root}/libfixture" \
  "${fixture_root}/libfixture.dSYM" \
  libfixture \
  "${fixture_root}/libfixture-arm64.dSYM" \
  "${fixture_root}/libfixture-x86_64.dSYM"

# A driver-created temporary object disappears before dsymutil can resolve its
# debug map. Capture must reject that warning instead of publishing a partial dSYM.
xcrun clang -arch arm64 -g -O2 -dynamiclib \
  "${fixture_root}/fixture.c" -o "${fixture_root}/libunresolved"
if "${repo_root}/tools/apple/capture-thin-dsym.sh" \
  "${fixture_root}/libunresolved" "${fixture_root}/libunresolved.dSYM" >/dev/null 2>&1; then
  echo "capture accepted an unresolved debug map" >&2
  exit 1
fi

# A fat binary cannot be paired with only one of its architecture dSYMs.
if "${repo_root}/tools/apple/merge-thin-dsyms.sh" \
  "${fixture_root}/libfixture" "${fixture_root}/libmissing-slice.dSYM" libfixture \
  "${fixture_root}/libfixture-arm64.dSYM" >/dev/null 2>&1; then
  echo "merge accepted a missing architecture dSYM" >&2
  exit 1
fi

# A dSYM from a different binary must fail even when the architecture matches.
cat > "${fixture_root}/other.c" <<'EOF'
int melivra_other_fixture(int value) { return value + 11; }
EOF
xcrun clang -arch arm64 -g -O2 -c \
  "${fixture_root}/other.c" -o "${fixture_root}/other.o"
xcrun clang -arch arm64 -dynamiclib \
  "${fixture_root}/other.o" -o "${fixture_root}/libother"
"${repo_root}/tools/apple/capture-thin-dsym.sh" \
  "${fixture_root}/libother" "${fixture_root}/libother.dSYM"
if "${repo_root}/tools/apple/merge-thin-dsyms.sh" \
  "${fixture_root}/libfixture-arm64" "${fixture_root}/libmismatch.dSYM" libfixture \
  "${fixture_root}/libother.dSYM" >/dev/null 2>&1; then
  echo "merge accepted a mismatched UUID" >&2
  exit 1
fi
