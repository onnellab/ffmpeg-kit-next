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

// Log levels are plain numbers everywhere in this binding, exactly as they are in the
// Flutter and React Native plugins: Log.getLevel(), FFmpegKitConfig.getLogLevel() and
// every worker payload carry the raw AV_LOG_* value. This class is a constant holder
// and is deliberately NOT constructible - there is no Level instance to hand out.
export class Level {
    /**
     * Returns log level string.
     *
     * @param {number} level log level
     * @returns {string} log level string
     */
    static levelToString(level) {
        switch (level) {
            case Level.AV_LOG_TRACE:
                return 'TRACE';
            case Level.AV_LOG_DEBUG:
                return 'DEBUG';
            case Level.AV_LOG_VERBOSE:
                return 'VERBOSE';
            case Level.AV_LOG_INFO:
                return 'INFO';
            case Level.AV_LOG_WARNING:
                return 'WARNING';
            case Level.AV_LOG_ERROR:
                return 'ERROR';
            case Level.AV_LOG_FATAL:
                return 'FATAL';
            case Level.AV_LOG_PANIC:
                return 'PANIC';
            case Level.AV_LOG_STDERR:
                return 'STDERR';
            case Level.AV_LOG_QUIET:
            default:
                return '';
        }
    }
}

Level.AV_LOG_STDERR = -16;
Level.AV_LOG_QUIET = -8;
Level.AV_LOG_PANIC = 0;
Level.AV_LOG_FATAL = 8;
Level.AV_LOG_ERROR = 16;
Level.AV_LOG_WARNING = 24;
Level.AV_LOG_INFO = 32;
Level.AV_LOG_VERBOSE = 40;
Level.AV_LOG_DEBUG = 48;
Level.AV_LOG_TRACE = 56;

Object.freeze(Level);
