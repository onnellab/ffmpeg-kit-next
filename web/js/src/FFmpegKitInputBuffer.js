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

// Public wrapper for the ffkitmem: in-memory input protocol. This lets FFmpeg read
// inputs without staging files in MEMFS (and its heap copy). The wrapper is a thin
// handle to a C++ object living in the worker; the worker keeps the real embind
// object in a registry keyed by an opaque handle, and these methods post ops to
// operate on it. Use getUrl() as an -i input in a command.

import {getFactory} from './FFmpegKitFactory.js';

/** Seekable in-memory input built from a byte array. Addressable via ffkitmem:. */
export class FFmpegKitInputBuffer {
    constructor(handle, url, size) {
        this._handle = handle;
        this._url = url;
        this._size = size;
    }

    /**
     * Registers byte-array data as a seekable input buffer.
     *
     * @param {Uint8Array} data bytes to expose through the generated ffkitmem: URL
     * @param {string} extension optional container hint, e.g. "mp4"
     * @returns {Promise<FFmpegKitInputBuffer>} buffer wrapper containing the generated URL
     */
    static async fromByteArray(data, extension = '') {
        const size = data.byteLength;
        const {handle, url} = await getFactory().ioCreate('inputBuffer', {extension, data});
        return new FFmpegKitInputBuffer(handle, url, size);
    }

    /** @returns {string} ffkitmem: URL to use as an FFmpeg input */
    getUrl() {
        return this._url;
    }

    /** @returns {number} size of the input buffer in bytes */
    getSize() {
        return this._size;
    }

    /** @returns {Promise<void>} resolves after the worker releases the buffer */
    close() {
        return getFactory().ioClose(this._handle);
    }
}
