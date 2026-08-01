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

// SessionType -> constructor lookup, so the modules that CREATE sessions never have
// to import the session classes.
//
// LEAF MODULE - MUST NOT IMPORT ANYTHING.
//
// FFmpegKitFactory and AbstractSession both need to instantiate FFmpegSession /
// FFprobeSession / MediaInformationSession, but those classes sit above them in the
// dependency order (they call getFactory() and extend AbstractSession). Importing
// them directly would close a cycle. Instead each session module registers itself
// here at module scope, and the creators look the constructor up at call time. The
// import graph stays acyclic in both directions.
//
// Registration happens when the session modules are evaluated. The package entry
// point (index.js) re-exports all three, so any supported import path evaluates
// them. Do NOT add "sideEffects": false to package.json - it would let a bundler
// drop a session module whose exports look unused and leave the registry empty.

const constructors = new Map();

/**
 * Registers the constructor to use for a session type.
 *
 * @param {number} sessionType one of the SessionType values
 * @param {function(): object} create zero-argument factory returning a new session
 */
export function registerSessionType(sessionType, create) {
    constructors.set(sessionType, create);
}

/**
 * Creates an empty session wrapper of the requested type.
 *
 * @param {number} sessionType one of the SessionType values
 * @returns {object} a newly constructed session
 */
export function createSession(sessionType) {
    const create = constructors.get(sessionType);
    if (create === undefined) {
        throw new Error(
            `No session constructor registered for session type ${sessionType}. ` +
                'Import the package entry point (index.js) rather than an internal module.'
        );
    }
    return create();
}
