# Rebuilding the iOS audio frameworks

1. Verify every file from this compliance bundle:

   ```sh
   shasum -a 256 -c SHA256SUMS
   ```

2. Assemble the exact Git repositories, including the libilbc Abseil submodule
   and build-tool sources:

   ```sh
   ./assemble-sources.sh /path/to/work
   cd /path/to/work/ffmpeg-kit-next
   ```

3. Install Nix and run the command recorded in `BUILD-MANIFEST.txt`. The
   assembled tree preserves Git metadata, exact commits, the pinned Nix lock,
   GNU config, and gas-preprocessor sources, so normal cleanup, checkout, and
   submodule operations do not require replacement source downloads.

4. Run `tools/apple/verify-xcframework-dsyms.sh` against the generated bundle.
   Compare its UUIDs with `UUID-MANIFEST.tsv` when reproducing the published
   binary. Compiler UUIDs may change if the recorded Xcode/SDK environment is
   not used.
