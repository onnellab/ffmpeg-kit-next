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

// Abstract session implementation with the features shared by FFmpeg, FFprobe and
// MediaInformation sessions. FFmpegKitFactory creates one per call, fills it from
// the worker's serialized result, and appends live logs/statistics as events arrive.
//
// The create*FromMap() statics build subclass instances through SessionRegistry
// rather than importing FFmpegSession/FFprobeSession/MediaInformationSession, which
// extend this class — a direct import would close a cycle.

import {parseArguments} from './Arguments.js';
import {SessionState, SessionType} from './Constants.js';
import {getFactory} from './FFmpegKitFactory.js';
import {Log} from './Log.js';
import {ReturnCode} from './ReturnCode.js';
import {Session} from './Session.js';
import {createSession} from './SessionRegistry.js';

export class AbstractSession extends Session {
    static DEFAULT_TIMEOUT_FOR_ASYNCHRONOUS_MESSAGES_IN_TRANSMIT = 5000;

    constructor(command = '', logCallback = null, logRedirectionStrategy = null) {
        super();
        this._sessionId = null;
        this._state = SessionState.CREATED;
        this._command = command;
        this._returnCode = null;
        this._duration = 0;
        this._logsText = '';
        this._failStackTrace = null;
        this._logs = [];
        this._createTime = 0;
        this._startTime = 0;
        this._endTime = 0;
        this._arguments = [];
        this._logCallback = logCallback || null;
        this._logRedirectionStrategy = logRedirectionStrategy;
        this._completeCallback = null; // set by subclasses for async runs
    }

    static createFFmpegSession(argumentsArray, logRedirectionStrategy = null) {
        return getFactory().createFFmpegSession(argumentsArray, logRedirectionStrategy);
    }

    // The *FromMap statics restore the session's recorded log redirection strategy
    // through the factory, exactly as Flutter's equivalents read it back out of
    // FFmpegKitFactory's map. Without that a session rebuilt from the native history
    // would report no strategy even though one was registered when it was created.
    static createFFmpegSessionFromMap(sessionMap) {
        const session = createSession(SessionType.FFMPEG);
        session._applySessionMap(sessionMap);
        return getFactory().applyRecordedLogRedirectionStrategy(session);
    }

    static createFFprobeSession(argumentsArray, logRedirectionStrategy = null) {
        return getFactory().createFFprobeSession(argumentsArray, logRedirectionStrategy);
    }

    static createFFprobeSessionFromMap(sessionMap) {
        const session = createSession(SessionType.FFPROBE);
        session._applySessionMap(sessionMap);
        return getFactory().applyRecordedLogRedirectionStrategy(session);
    }

    static createMediaInformationSession(argumentsArray) {
        return getFactory().createMediaInformationSession(argumentsArray);
    }

    static createMediaInformationSessionFromMap(sessionMap) {
        const session = createSession(SessionType.MEDIA_INFORMATION);
        session._applySessionMap(sessionMap);
        return session;
    }

    getSessionId() {
        return this._sessionId;
    }

    getCommand() {
        return this._command;
    }

    getArguments() {
        return this._arguments;
    }

    getState() {
        return this._state;
    }

    getReturnCode() {
        return this._returnCode;
    }

    getDuration() {
        return this._duration;
    }

    getCreateTime() {
        return this._createTime ? new Date(this._createTime) : null;
    }

    getStartTime() {
        return this._startTime ? new Date(this._startTime) : null;
    }

    getEndTime() {
        return this._endTime ? new Date(this._endTime) : null;
    }

    // Native AbstractSession::getOutput() is defined as getAllLogsAsString(), and no
    // session subclass overrides it. Delegating keeps the two from ever drifting apart.
    getOutput() {
        return this.getAllLogsAsString();
    }

    // The getAll* family forwards waitTimeout to the native method of the same name,
    // which waits for this session's messages in transmit and then returns the delivered
    // record - the same call the Flutter and React Native plugins make, which is why
    // these are the asynchronous members of the family. Omit waitTimeout to use the
    // native 5000 ms default. The plain getLogs()/getLogsAsString() variants stay
    // synchronous and never wait, matching their "return immediately" contract.
    async getAllLogsAsString(waitTimeout) {
        const logs = await getFactory().getAllLogsAsString(this, waitTimeout ?? null);
        return logs ?? this._logsText;
    }

    getLogsAsString() {
        return this._logsText;
    }

    getLogs() {
        return this._logs.slice();
    }

    async getAllLogs(waitTimeout) {
        const logs = await getFactory().getAllLogs(this, waitTimeout ?? null);
        return logs ?? this._logs.slice();
    }

    getFailStackTrace() {
        return this._failStackTrace;
    }

    // The session's callbacks live in FFmpegKitFactory keyed by session id, exactly as
    // they do in the Flutter and React Native factories: that is what lets a session
    // rebuilt from the native history report the callbacks registered when it was created,
    // and what makes deleteSession()/clearSessions() drop them. The instance field is only
    // a fallback for a session constructed directly, before it has a native id.
    getLogCallback() {
        return getFactory().getSessionLogCallback(this._sessionId) ?? this._logCallback;
    }

    // Session-specific log redirection strategy, or null to fall back to the global
    // default set via FFmpegKitConfig.setLogRedirectionStrategy().
    getLogRedirectionStrategy() {
        return this._logRedirectionStrategy;
    }

    // Complete callback invoked with the populated session once an async run finishes.
    // Registry-backed, see getLogCallback().
    getCompleteCallback() {
        return getFactory().getSessionCompleteCallback(this._sessionId) ?? this._completeCallback;
    }

    // Never starts a runtime, for the same reason the getAll* family does not: a module
    // that had to be booted to answer cannot be holding any of this session's messages.
    // Flutter's equivalent likewise skips the init() its FFmpegKitConfig counterpart does.
    async thereAreAsynchronousMessagesInTransmit() {
        const factory = getFactory();
        if (this._sessionId == null || !factory.hasRuntime()) return false;
        return (await factory.messagesInTransmit(this._sessionId)) > 0;
    }

    isFFmpeg() {
        return false;
    }

    isFFprobe() {
        return false;
    }

    isMediaInformation() {
        return false;
    }

    // Cancels this session, or all sessions when this wrapper has no native id yet.
    cancel() {
        return getFactory().cancel(this._sessionId);
    }

    // Populate from the worker's serialized session result.
    _apply(result) {
        if (!result) return;
        this._sessionId = result.sessionId ?? this._sessionId;
        this._state = result.state ?? this._state;
        this._command = result.command ?? this._command;
        if (Array.isArray(result.arguments)) this._arguments = result.arguments;
        if (Object.prototype.hasOwnProperty.call(result, 'returnCode')) {
            const returnCodeValue =
                result.returnCode != null && typeof result.returnCode === 'object'
                    ? result.returnCode.value
                    : result.returnCode;
            this._returnCode = returnCodeValue != null ? new ReturnCode(returnCodeValue) : null;
        }
        if (Object.prototype.hasOwnProperty.call(result, 'duration')) {
            this._duration = result.duration ?? 0;
        }
        this._createTime = result.createTime ?? this._createTime;
        this._startTime = result.startTime ?? this._startTime;
        this._endTime = result.endTime ?? this._endTime;
        if (Object.prototype.hasOwnProperty.call(result, 'logs')) {
            this._logsText = result.logs ?? '';
        }
        if (Object.prototype.hasOwnProperty.call(result, 'failStackTrace')) {
            this._failStackTrace = result.failStackTrace || null;
        }
        if (Array.isArray(result.logEntries)) {
            this._logs = result.logEntries.map((l) => new Log(l.sessionId, l.level, l.message));
        }
    }

    _applySessionMap(sessionMap) {
        if (!sessionMap) return;
        this._apply(sessionMap);
        if (!Array.isArray(sessionMap.arguments)) {
            this._arguments = parseArguments(this._command || '');
        }
    }

    // Append a live log (called by FFmpegKitFactory as events arrive).
    _addLog(log) {
        this._logs.push(log);
        this._logsText += log.getMessage();
    }
}
