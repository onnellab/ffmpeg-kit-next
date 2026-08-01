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

export class StreamInformation {
    static KEY_INDEX = 'index';
    static KEY_TYPE = 'codec_type';
    static KEY_CODEC = 'codec_name';
    static KEY_CODEC_LONG = 'codec_long_name';
    static KEY_FORMAT = 'pix_fmt';
    static KEY_WIDTH = 'width';
    static KEY_HEIGHT = 'height';
    static KEY_BIT_RATE = 'bit_rate';
    static KEY_SAMPLE_RATE = 'sample_rate';
    static KEY_SAMPLE_FORMAT = 'sample_fmt';
    static KEY_CHANNEL_LAYOUT = 'channel_layout';
    static KEY_SAMPLE_ASPECT_RATIO = 'sample_aspect_ratio';
    static KEY_DISPLAY_ASPECT_RATIO = 'display_aspect_ratio';
    static KEY_AVERAGE_FRAME_RATE = 'avg_frame_rate';
    static KEY_REAL_FRAME_RATE = 'r_frame_rate';
    static KEY_TIME_BASE = 'time_base';
    static KEY_CODEC_TIME_BASE = 'codec_time_base';
    static KEY_TAGS = 'tags';

    constructor(data) {
        this._allProperties = data ?? null;
    }

    getIndex() {
        return this.getNumberProperty(StreamInformation.KEY_INDEX);
    }

    getType() {
        return this.getStringProperty(StreamInformation.KEY_TYPE);
    }

    getCodec() {
        return this.getStringProperty(StreamInformation.KEY_CODEC);
    }

    getCodecLong() {
        return this.getStringProperty(StreamInformation.KEY_CODEC_LONG);
    }

    getFormat() {
        return this.getStringProperty(StreamInformation.KEY_FORMAT);
    }

    getWidth() {
        return this.getNumberProperty(StreamInformation.KEY_WIDTH);
    }

    getHeight() {
        return this.getNumberProperty(StreamInformation.KEY_HEIGHT);
    }

    getBitrate() {
        return this.getStringProperty(StreamInformation.KEY_BIT_RATE);
    }

    getSampleRate() {
        return this.getStringProperty(StreamInformation.KEY_SAMPLE_RATE);
    }

    getSampleFormat() {
        return this.getStringProperty(StreamInformation.KEY_SAMPLE_FORMAT);
    }

    getChannelLayout() {
        return this.getStringProperty(StreamInformation.KEY_CHANNEL_LAYOUT);
    }

    getSampleAspectRatio() {
        return this.getStringProperty(StreamInformation.KEY_SAMPLE_ASPECT_RATIO);
    }

    getDisplayAspectRatio() {
        return this.getStringProperty(StreamInformation.KEY_DISPLAY_ASPECT_RATIO);
    }

    getAverageFrameRate() {
        return this.getStringProperty(StreamInformation.KEY_AVERAGE_FRAME_RATE);
    }

    getRealFrameRate() {
        return this.getStringProperty(StreamInformation.KEY_REAL_FRAME_RATE);
    }

    getTimeBase() {
        return this.getStringProperty(StreamInformation.KEY_TIME_BASE);
    }

    getCodecTimeBase() {
        return this.getStringProperty(StreamInformation.KEY_CODEC_TIME_BASE);
    }

    getTags() {
        return this.getProperty(StreamInformation.KEY_TAGS);
    }

    getStringProperty(key) {
        return this._getProperty(key);
    }

    getNumberProperty(key) {
        return this._getProperty(key);
    }

    getProperty(key) {
        return this._getProperty(key);
    }

    getAllProperties() {
        return this._allProperties;
    }

    _getProperty(key) {
        if (this._allProperties == null) {
            return null;
        }
        if (Object.prototype.hasOwnProperty.call(this._allProperties, key)) {
            return this._allProperties[key];
        }
        return null;
    }
}
