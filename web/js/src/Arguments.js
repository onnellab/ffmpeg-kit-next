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

// Command-string helpers, exposed publicly as FFmpegKitConfig.parseArguments() and
// FFmpegKitConfig.argumentsToString().
//
// LEAF MODULE - MUST NOT IMPORT ANYTHING.
//
// AbstractSession needs parseArguments() to rebuild the argument array for sessions
// reconstructed from the native history. Reaching up into FFmpegKitConfig for it
// would make a low-level type depend on a top-level facade, so the implementation
// lives here and FFmpegKitConfig delegates.

/**
 * Parses a command string into arguments. Splits on space, honouring single and
 * double quote characters.
 *
 * @param {string} command command string
 * @returns {string[]} command arguments
 */
export function parseArguments(command) {
    const argumentList = [];
    let currentArgument = '';
    let singleQuoteStarted = false;
    let doubleQuoteStarted = false;

    for (let i = 0; i < command.length; i++) {
        const previousChar = i > 0 ? command.charAt(i - 1) : null;
        const currentChar = command.charAt(i);

        if (currentChar === ' ') {
            if (singleQuoteStarted || doubleQuoteStarted) {
                currentArgument += currentChar;
            } else if (currentArgument.length > 0) {
                argumentList.push(currentArgument);
                currentArgument = '';
            }
        } else if (currentChar === "'" && (previousChar == null || previousChar !== '\\')) {
            if (singleQuoteStarted) singleQuoteStarted = false;
            else if (doubleQuoteStarted) currentArgument += currentChar;
            else singleQuoteStarted = true;
        } else if (currentChar === '"' && (previousChar == null || previousChar !== '\\')) {
            if (doubleQuoteStarted) doubleQuoteStarted = false;
            else if (singleQuoteStarted) currentArgument += currentChar;
            else doubleQuoteStarted = true;
        } else {
            currentArgument += currentChar;
        }
    }
    if (currentArgument.length > 0) argumentList.push(currentArgument);
    return argumentList;
}

// Joins arguments back into a space-separated command string (display only; lossy for
// arguments that contain spaces — use the argument-array APIs for those).
export function argumentsToString(commandArguments) {
    if (commandArguments == null) return String(commandArguments);
    return Array.isArray(commandArguments) ? commandArguments.join(' ') : '';
}
