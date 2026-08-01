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

// LEAF MODULE - MUST NOT IMPORT ANYTHING.

/** Log entry produced by an FFmpegKit session. */
export class Log {
    /**
     * Creates a log entry.
     *
     * @param {number} sessionId session that produced the log
     * @param {number} level FFmpeg log level value
     * @param {string} message log message text
     */
    constructor(sessionId, level, message) {
        this._sessionId = sessionId;
        this._level = level;
        this._message = message;
    }

    /** @returns {number} id of the session that produced this log entry */
    getSessionId() {
        return this._sessionId;
    }

    /** @returns {number} FFmpeg log level value */
    getLevel() {
        return this._level;
    }

    /** @returns {string} log message text */
    getMessage() {
        return this._message;
    }
}
