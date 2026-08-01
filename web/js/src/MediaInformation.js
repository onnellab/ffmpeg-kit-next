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

import {Chapter} from './Chapter.js';
import {StreamInformation} from './StreamInformation.js';

export class MediaInformation {
    static KEY_FORMAT_PROPERTIES = 'format';
    static KEY_FILENAME = 'filename';
    static KEY_FORMAT = 'format_name';
    static KEY_FORMAT_LONG = 'format_long_name';
    static KEY_START_TIME = 'start_time';
    static KEY_DURATION = 'duration';
    static KEY_SIZE = 'size';
    static KEY_BIT_RATE = 'bit_rate';
    static KEY_TAGS = 'tags';

    constructor(data) {
        this._allProperties = data ?? null;
    }

    getFilename() {
        return this.getStringFormatProperty(MediaInformation.KEY_FILENAME);
    }

    getFormat() {
        return this.getStringFormatProperty(MediaInformation.KEY_FORMAT);
    }

    getLongFormat() {
        return this.getStringFormatProperty(MediaInformation.KEY_FORMAT_LONG);
    }

    getDuration() {
        return this.getStringFormatProperty(MediaInformation.KEY_DURATION);
    }

    getStartTime() {
        return this.getStringFormatProperty(MediaInformation.KEY_START_TIME);
    }

    getSize() {
        return this.getStringFormatProperty(MediaInformation.KEY_SIZE);
    }

    getBitrate() {
        return this.getStringFormatProperty(MediaInformation.KEY_BIT_RATE);
    }

    getTags() {
        return this.getFormatProperty(MediaInformation.KEY_TAGS);
    }

    getStreams() {
        const streams = this._allProperties?.streams;
        return Array.isArray(streams)
            ? streams.map((stream) => new StreamInformation(stream))
            : [];
    }

    getChapters() {
        const chapters = this._allProperties?.chapters;
        return Array.isArray(chapters)
            ? chapters.map((chapter) => new Chapter(chapter))
            : [];
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

    getStringFormatProperty(key) {
        return this.getFormatProperty(key);
    }

    getNumberFormatProperty(key) {
        return this.getFormatProperty(key);
    }

    getFormatProperty(key) {
        const formatProperties = this.getFormatProperties();
        if (
            formatProperties != null &&
            Object.prototype.hasOwnProperty.call(formatProperties, key)
        ) {
            return formatProperties[key];
        }
        return null;
    }

    getFormatProperties() {
        const formatProperties = this._allProperties?.[MediaInformation.KEY_FORMAT_PROPERTIES];
        return formatProperties && typeof formatProperties === 'object'
            ? formatProperties
            : null;
    }

    getAllProperties() {
        return this._allProperties;
    }
}
