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

import {getFactory} from './FFmpegKitFactory.js';
import {MediaInformation} from './MediaInformation.js';

/**
 * Parser that constructs {@link MediaInformation} from FFprobe JSON output.
 */
export class MediaInformationJsonParser {
    /**
     * Parses FFprobe JSON output into media information.
     *
     * This method resolves null when parsing fails, and also when the input parses to
     * nothing (`{}`), matching the Flutter and React Native parsers. Use
     * {@link fromWithError} when invalid JSON should reject the promise instead; it
     * also returns the empty result rather than nulling it.
     *
     * @param {string} ffprobeJsonOutput FFprobe JSON output
     * @returns {Promise<MediaInformation|null>} parsed media information, or null on a
     * parse error or an empty result
     */
    static async from(ffprobeJsonOutput) {
        const media = await getFactory().mediaInformationJsonParserFrom(ffprobeJsonOutput);
        return media == null ? null : new MediaInformation(media);
    }

    /**
     * Parses FFprobe JSON output into media information and rejects on parse errors.
     *
     * @param {string} ffprobeJsonOutput FFprobe JSON output
     * @returns {Promise<MediaInformation>} parsed media information
     */
    static async fromWithError(ffprobeJsonOutput) {
        const media = await getFactory().mediaInformationJsonParserFromWithError(ffprobeJsonOutput);
        if (media == null) {
            throw new Error('Parsing MediaInformation failed.');
        }
        return new MediaInformation(media);
    }
}
