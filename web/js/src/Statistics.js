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

export class Statistics {
    constructor(
        sessionIdOrData,
        videoFrameNumber,
        videoFps,
        videoQuality,
        size,
        time,
        bitrate,
        speed
    ) {
        // Discriminate on the first argument's type, not on how many arguments were
        // passed: `new Statistics(map, undefined)` must still take the map branch.
        if (sessionIdOrData != null && typeof sessionIdOrData === 'object') {
            const data = sessionIdOrData;
            this._sessionId = data.sessionId;
            this._videoFrameNumber = data.frame ?? data.videoFrameNumber;
            this._videoFps = data.fps ?? data.videoFps;
            this._videoQuality = data.quality ?? data.videoQuality;
            this._size = data.size;
            this._time = data.time;
            this._bitrate = data.bitrate;
            this._speed = data.speed;
        } else {
            this._sessionId = sessionIdOrData;
            this._videoFrameNumber = videoFrameNumber;
            this._videoFps = videoFps;
            this._videoQuality = videoQuality;
            this._size = size;
            this._time = time;
            this._bitrate = bitrate;
            this._speed = speed;
        }
    }

    getSessionId() {
        return this._sessionId;
    }

    setSessionId(sessionId) {
        this._sessionId = sessionId;
    }

    getVideoFrameNumber() {
        return this._videoFrameNumber;
    }

    setVideoFrameNumber(videoFrameNumber) {
        this._videoFrameNumber = videoFrameNumber;
    }

    getVideoFps() {
        return this._videoFps;
    }

    setVideoFps(videoFps) {
        this._videoFps = videoFps;
    }

    getVideoQuality() {
        return this._videoQuality;
    }

    setVideoQuality(videoQuality) {
        this._videoQuality = videoQuality;
    }

    getSize() {
        return this._size;
    }

    setSize(size) {
        this._size = size;
    }

    getTime() {
        return this._time;
    }

    setTime(time) {
        this._time = time;
    }

    getBitrate() {
        return this._bitrate;
    }

    setBitrate(bitrate) {
        this._bitrate = bitrate;
    }

    getSpeed() {
        return this._speed;
    }

    setSpeed(speed) {
        this._speed = speed;
    }
}
