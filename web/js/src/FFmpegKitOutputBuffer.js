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

import {getFactory} from './FFmpegKitFactory.js';

/** Seekable in-memory output; read the produced bytes with toByteArray() afterward. */
export class FFmpegKitOutputBuffer {
    constructor(handle, url) {
        this._handle = handle;
        this._url = url;
    }

    /**
     * Creates a seekable output buffer.
     *
     * Positional parameters, matching the React Native plugin's
     * FFmpegKitOutputBuffer.create().
     *
     * @param {string} extension optional output format hint, e.g. "mp4"
     * @param {?number} initialCapacity optional starting size in bytes; must be paired with maxCapacity
     * @param {?number} maxCapacity optional upper bound in bytes; must be paired with initialCapacity
     * @returns {Promise<FFmpegKitOutputBuffer>} buffer wrapper containing the generated URL
     */
    static async create(extension = '', initialCapacity = null, maxCapacity = null) {
        const {handle, url} = await getFactory().ioCreate('outputBuffer', {
            extension,
            initialCapacity,
            maxCapacity,
        });
        return new FFmpegKitOutputBuffer(handle, url);
    }

    /** @returns {string} ffkitmem: URL to use as an FFmpeg output */
    getUrl() {
        return this._url;
    }

    /** @returns {Promise<number>} number of bytes currently held by the output buffer */
    getSize() {
        return getFactory().ioGetSize(this._handle);
    }

    /** @returns {Promise<Uint8Array>} the bytes written so far. */
    toByteArray() {
        return getFactory().ioOutputBytes(this._handle);
    }

    /** @returns {Promise<void>} resolves after the worker releases the buffer */
    close() {
        return getFactory().ioClose(this._handle);
    }
}
