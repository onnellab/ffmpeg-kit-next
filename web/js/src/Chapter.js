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

export class Chapter {
    static KEY_ID = 'id';
    static KEY_TIME_BASE = 'time_base';
    static KEY_START = 'start';
    static KEY_START_TIME = 'start_time';
    static KEY_END = 'end';
    static KEY_END_TIME = 'end_time';
    static KEY_TAGS = 'tags';

    constructor(data) {
        this._allProperties = data ?? null;
    }

    getId() {
        return this.getNumberProperty(Chapter.KEY_ID);
    }

    getTimeBase() {
        return this.getStringProperty(Chapter.KEY_TIME_BASE);
    }

    getStart() {
        return this.getNumberProperty(Chapter.KEY_START);
    }

    getStartTime() {
        return this.getStringProperty(Chapter.KEY_START_TIME);
    }

    getEnd() {
        return this.getNumberProperty(Chapter.KEY_END);
    }

    getEndTime() {
        return this.getStringProperty(Chapter.KEY_END_TIME);
    }

    getTags() {
        return this.getProperty(Chapter.KEY_TAGS);
    }

    getStringProperty(key) {
        return this.getProperty(key);
    }

    getNumberProperty(key) {
        return this.getProperty(key);
    }

    getProperty(key) {
        if (
            this._allProperties != null &&
            Object.prototype.hasOwnProperty.call(this._allProperties, key)
        ) {
            return this._allProperties[key];
        }
        return null;
    }

    getAllProperties() {
        return this._allProperties;
    }
}
