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

export class FFprobeSession extends AbstractSession {
    static async create(
        argumentsArray,
        completeCallback = null,
        logCallback = null,
        logRedirectionStrategy = null
    ) {
        const session = await AbstractSession.createFFprobeSession(
            argumentsArray,
            logRedirectionStrategy
        );
        getFactory().setSessionCallbacks(session.getSessionId(), {
            completeCallback,
            logCallback,
        });
        return session;
    }

    constructor(
        command = '',
        completeCallback = null,
        logCallback = null,
        logRedirectionStrategy = null
    ) {
        super(command, logCallback, logRedirectionStrategy);
        this._completeCallback = completeCallback || null;
    }

    isFFmpeg() {
        return false;
    }

    isFFprobe() {
        return true;
    }

    isMediaInformation() {
        return false;
    }
}

// Lets FFmpegKitFactory and AbstractSession construct this class without importing it.
registerSessionType(SessionType.FFPROBE, () => new FFprobeSession());
