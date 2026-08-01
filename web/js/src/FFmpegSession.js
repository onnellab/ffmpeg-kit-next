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

import {AbstractSession} from './AbstractSession.js';
import {SessionType} from './Constants.js';
import {getFactory} from './FFmpegKitFactory.js';
import {registerSessionType} from './SessionRegistry.js';
import {Statistics} from './Statistics.js';

export class FFmpegSession extends AbstractSession {
    static async create(
        argumentsArray,
        completeCallback = null,
        logCallback = null,
        statisticsCallback = null,
        logRedirectionStrategy = null
    ) {
        const session = await AbstractSession.createFFmpegSession(
            argumentsArray,
            logRedirectionStrategy
        );
        getFactory().setSessionCallbacks(session.getSessionId(), {
            completeCallback,
            logCallback,
            statisticsCallback,
        });
        return session;
    }

    constructor(
        command = '',
        completeCallback = null,
        logCallback = null,
        statisticsCallback = null,
        logRedirectionStrategy = null
    ) {
        super(command, logCallback, logRedirectionStrategy);
        this._statistics = [];
        this._completeCallback = completeCallback || null;
        this._statisticsCallback = statisticsCallback || null;
    }

    getStatistics() {
        return this._statistics.slice();
    }

    // Waits for the messages still in transmit before reporting, like getAllLogs() -
    // see the note on AbstractSession.getAllLogsAsString().
    async getAllStatistics(waitTimeout = null) {
        const statistics = await getFactory().getAllStatistics(this, waitTimeout);
        return statistics ?? this._statistics.slice();
    }

    getLastReceivedStatistics() {
        return this._statistics[this._statistics.length - 1] || null;
    }

    // Registry-backed, see AbstractSession.getLogCallback().
    getStatisticsCallback() {
        return (
            getFactory().getSessionStatisticsCallback(this.getSessionId()) ??
            this._statisticsCallback
        );
    }

    isFFmpeg() {
        return true;
    }

    isFFprobe() {
        return false;
    }

    isMediaInformation() {
        return false;
    }

    _apply(result) {
        super._apply(result);
        if (Array.isArray(result?.statistics)) {
            this._statistics = result.statistics.map((s) => new Statistics(s));
        }
    }

    _addStatistics(statistics) {
        this._statistics.push(statistics);
    }
}

// Lets FFmpegKitFactory and AbstractSession construct this class without importing it.
registerSessionType(SessionType.FFMPEG, () => new FFmpegSession());
