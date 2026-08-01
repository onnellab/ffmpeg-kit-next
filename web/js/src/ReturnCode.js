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

/** Return code produced by an FFmpegKit session. */
export class ReturnCode {
    static SUCCESS = 0;
    static CANCEL = 255;

    /**
     * Creates a return-code wrapper.
     *
     * @param {number} value numeric return code produced by FFmpegKit
     */
    constructor(value) {
        this._value = value;
    }

    /**
     * Tests whether the supplied return code represents a successful execution.
     *
     * @param {ReturnCode|null|undefined} returnCode return-code wrapper to inspect
     * @returns {boolean} true when the return code value is {@link ReturnCode.SUCCESS}
     */
    static isSuccess(returnCode) {
        return returnCode != null && returnCode.getValue() === ReturnCode.SUCCESS;
    }

    /**
     * Tests whether the supplied return code represents a cancelled execution.
     *
     * @param {ReturnCode|null|undefined} returnCode return-code wrapper to inspect
     * @returns {boolean} true when the return code value is {@link ReturnCode.CANCEL}
     */
    static isCancel(returnCode) {
        return returnCode != null && returnCode.getValue() === ReturnCode.CANCEL;
    }

    /** @returns {number} numeric return-code value */
    getValue() {
        return this._value;
    }

    /** @returns {boolean} true when this return-code value is {@link ReturnCode.SUCCESS} */
    isValueSuccess() {
        return this._value === ReturnCode.SUCCESS;
    }

    /** @returns {boolean} true when this return-code value is neither success nor cancel */
    isValueError() {
        return this._value !== ReturnCode.SUCCESS && this._value !== ReturnCode.CANCEL;
    }

    /** @returns {boolean} true when this return-code value is {@link ReturnCode.CANCEL} */
    isValueCancel() {
        return this._value === ReturnCode.CANCEL;
    }

    /** @returns {string} decimal string representation of the return-code value */
    toString() {
        return String(this._value);
    }
}
