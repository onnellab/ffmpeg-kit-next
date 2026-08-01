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

// Streaming note: the worker services stream read() while native execution runs on
// its own pthread, but it does so NON-BLOCKING (it must not block its own event
// loop). read() may return null (nothing ready yet) — loop and retry, interleaved
// with the running command.

import {getFactory} from './FFmpegKitFactory.js';

/**
 * Non-seekable streaming output for ffkitstream: URLs.
 *
 * Pass getUrl() as an FFmpeg output target and call read() while a command is
 * producing data.
 */
export class FFmpegKitStreamOutput {
    constructor(handle, url) {
        this._handle = handle;
        this._url = url;
    }

    /**
     * Creates a streaming output handle.
     *
     * Positional parameters, matching the React Native plugin's
     * FFmpegKitStreamOutput.create().
     *
     * @param {string} extension Optional format hint, for example "mp4".
     * @param {?number} capacity Optional ring-buffer capacity in bytes.
     * @returns {Promise<FFmpegKitStreamOutput>} a streaming output whose URL can be passed to FFmpeg.
     */
    static async create(extension = '', capacity = null) {
        const {handle, url} = await getFactory().ioCreate('streamOutput', {extension, capacity});
        return new FFmpegKitStreamOutput(handle, url);
    }

    /** @returns {string} the ffkitstream: URL to use as an FFmpeg output target. */
    getUrl() {
        return this._url;
    }

    /**
     * Attempts to read produced bytes from the stream output.
     *
     * This call is non-blockings.
     *
     * @param {number} maxBytes maximum number of bytes to read.
     * @returns {Promise<Uint8Array|null>} a non-empty Uint8Array when data is available,
     * an empty Uint8Array at EOF/closed, or null when no data is ready yet and the caller
     * should retry.
     */
    read(maxBytes) {
        return getFactory().ioStreamRead(this._handle, maxBytes);
    }

    /** @returns {Promise<void>} resolves after the streaming output resources are released. */
    close() {
        return getFactory().ioClose(this._handle);
    }
}
