/*
 * Copyright (c) 2026 Taner Sener
 *
 * This file is part of FFmpegKitNext.
 *
 * FFmpegKitNext is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * FFmpegKitNext is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General License for more details.
 *
 * You should have received a copy of the GNU Lesser General License
 * along with FFmpegKitNext. If not, see <http://www.gnu.org/licenses/>.
 */

// Web-only virtual-filesystem helpers. The module's MEMFS lives inside the worker;
// these move bytes across for inputs/outputs (no native-platform equivalent).

import {getFactory} from './FFmpegKitFactory.js';

export function writeFile(path, data) {
    return getFactory().writeFile(path, data);
}

export function readFile(path) {
    return getFactory().readFile(path);
}

// Web-only: mount File/Blob inputs read-only via WORKERFS at `mountPoint`, so FFmpeg
// reads them by path without copying into the wasm heap — preferred for large inputs.
// `files` are File objects; `blobs` are `{ name, data: Blob }`.
export function mount(mountPoint, options = {}) {
    return getFactory().mount(mountPoint, options);
}
