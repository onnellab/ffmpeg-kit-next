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
//
// Common interface for all FFmpegKit sessions.

export class Session {
    _notImplemented(methodName) {
        throw new Error(`${methodName} must be implemented by a Session subclass.`);
    }

    getSessionId() {
        return this._notImplemented('getSessionId');
    }

    getCommand() {
        return this._notImplemented('getCommand');
    }

    getArguments() {
        return this._notImplemented('getArguments');
    }

    getState() {
        return this._notImplemented('getState');
    }

    getReturnCode() {
        return this._notImplemented('getReturnCode');
    }

    getDuration() {
        return this._notImplemented('getDuration');
    }

    getCreateTime() {
        return this._notImplemented('getCreateTime');
    }

    getStartTime() {
        return this._notImplemented('getStartTime');
    }

    getEndTime() {
        return this._notImplemented('getEndTime');
    }

    getOutput() {
        return this._notImplemented('getOutput');
    }

    getAllLogsAsString(waitTimeout) {
        return this._notImplemented('getAllLogsAsString');
    }

    getLogsAsString() {
        return this._notImplemented('getLogsAsString');
    }

    getLogs() {
        return this._notImplemented('getLogs');
    }

    getAllLogs(waitTimeout) {
        return this._notImplemented('getAllLogs');
    }

    getFailStackTrace() {
        return this._notImplemented('getFailStackTrace');
    }

    getLogCallback() {
        return this._notImplemented('getLogCallback');
    }

    getLogRedirectionStrategy() {
        return this._notImplemented('getLogRedirectionStrategy');
    }

    thereAreAsynchronousMessagesInTransmit() {
        return this._notImplemented('thereAreAsynchronousMessagesInTransmit');
    }

    cancel() {
        return this._notImplemented('cancel');
    }

    isFFmpeg() {
        return this._notImplemented('isFFmpeg');
    }

    isFFprobe() {
        return this._notImplemented('isFFprobe');
    }

    isMediaInformation() {
        return this._notImplemented('isMediaInformation');
    }
}
