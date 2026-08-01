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

// Streaming note: the worker services stream write()/read() while native execution
// runs on its own pthread, but it does so NON-BLOCKING (it must not block its own
// event loop). write() may accept fewer bytes than offered — loop and retry,
// interleaved with the running command.

import {getFactory} from './FFmpegKitFactory.js';

/**
 * Non-seekable streaming input for ffkitstream: URLs.
 *
 * Pass getUrl() as an FFmpeg input and call write() while a command is consuming
 * the stream. closeInput() signals end-of-input.
 */
export class FFmpegKitStreamInput {
    constructor(handle, url) {
        this._handle = handle;
        this._url = url;
    }

    /**
     * Creates a streaming input handle.
     *
     * Positional parameters, matching the React Native plugin's
     * FFmpegKitStreamInput.create().
     *
     * @param {string} extension Optional format hint, for example "mp4".
     * @param {?number} capacity Optional ring-buffer capacity in bytes.
     * @returns {Promise<FFmpegKitStreamInput>} a streaming input whose URL can be passed to FFmpeg.
     */
    static async create(extension = '', capacity = null) {
        const {handle, url} = await getFactory().ioCreate('streamInput', {extension, capacity});
        return new FFmpegKitStreamInput(handle, url);
    }

    /** @returns {string} the ffkitstream: URL to use as an FFmpeg input. */
    getUrl() {
        return this._url;
    }

    /**
     * Attempts to append bytes to the stream input.
     *
     * This call is non-blocking. It resolves with the number of bytes
     * accepted into the internal ring buffer. The value can be smaller than
     * data.byteLength, including 0, when the buffer is full. Retry the remaining
     * bytes after FFmpeg has consumed more data. The input bytes are copied before
     * posting to the worker, so this call does not detach the caller's buffer.
     *
     * @param {Uint8Array} data bytes to append.
     * @returns {Promise<number>} number of bytes accepted into the stream buffer.
     */
    write(data) {
        return getFactory().ioStreamWrite(this._handle, data);
    }

    /**
     * Signals end-of-input so the reader sees EOF once the ring drains.
     *
     * @returns {Promise<void>} resolves after EOF has been signaled.
     */
    closeInput() {
        return getFactory().ioStreamCloseInput(this._handle);
    }

    /** @returns {Promise<void>} resolves after the streaming input resources are released. */
    close() {
        return getFactory().ioClose(this._handle);
    }
}
