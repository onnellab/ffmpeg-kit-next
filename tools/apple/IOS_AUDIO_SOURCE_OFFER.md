# iOS audio framework source and relinking notice

The accompanying iOS audio XCFrameworks contain FFmpegKitNext, FFmpeg, and
the libraries listed in `components.tsv`. The FFmpegKitNext and FFmpeg portions
are distributed under GNU LGPL version 3 or later. Other components retain the
licenses and copyright notices included under `notices/`.

The `sources/` directory contains a complete Git bundle of every linked source
checkout and build-tool source used by the release build, including the
libilbc Abseil submodule, GNU config, gas-preprocessor, ONNELLAB's build
scripts, and dSYM changes. Every bundle is pinned to the full commit shown in
`components.tsv`, and all digests are recorded in `SHA256SUMS`. The exact build
invocation is recorded in `BUILD-MANIFEST.txt`; the pinned Nix toolchain is part
of the `ffmpeg-kit-next` source bundle. `REBUILD.md` and
`assemble-sources.sh` reconstruct a build-ready Git working tree without
replacement source downloads.

The pinned gas-preprocessor source is offered under GPL version 2 or later.
ONNELLAB exercises the later-version option and distributes it under GPL
version 3; the complete GPLv3 text is included as `notices/LICENSE.GPLv3`.

Recipients may replace or modify the LGPL-covered portions and may reverse engineer
the combined work for debugging those modifications. ONNELLAB does
not impose additional restrictions on rights granted by the applicable open
source licenses.

For the public release, the binary and this complete source bundle are offered
from the same GitHub release page and remain available together for as long as
the binary is offered.
