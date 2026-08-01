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

// Lint configuration for the hand-written JS binding layer.
//
// The rule that matters here is import/no-cycle. A cycle between index.js and
// FFmpegKitFactory.js once made the package throw at import time, because a
// module-scope const read an enum out of a module that was still evaluating.
// Cycles are banned outright so that failure mode cannot return.
//
// test/module-graph.test.mjs enforces the same invariant with no dependencies, so
// CI stays protected even where `npm install` has not run. This config exists for
// editor feedback and for the extra import hygiene rules below.

import importPlugin from 'eslint-plugin-import';

export default [
    {
        files: ['js/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                Blob: 'readonly',
                File: 'readonly',
                URL: 'readonly',
                Uint8Array: 'readonly',
                Worker: 'readonly',
                console: 'readonly',
                postMessage: 'readonly',
                self: 'readonly',
                setTimeout: 'readonly',
            },
        },
        plugins: {import: importPlugin},
        settings: {
            'import/resolver': {node: {extensions: ['.js', '.mjs']}},
        },
        rules: {
            // The guard against the load-time TDZ crash. Do not downgrade.
            'import/no-cycle': ['error', {maxDepth: Infinity, allowUnsafeDynamicCyclicDependency: false}],
            'import/no-self-import': 'error',
            // ../lib/libffmpegkit.js is a build artefact, absent from the source tree.
            'import/no-unresolved': ['error', {ignore: ['\\.\\./lib/']}],
            'import/no-useless-path-segments': 'error',
            'import/first': 'error',
        },
    },
    {
        // The barrel exists to re-export; it must not declare anything itself.
        files: ['js/index.js'],
        rules: {
            'no-restricted-syntax': [
                'error',
                {
                    selector:
                        'Program > VariableDeclaration, Program > ClassDeclaration, Program > FunctionDeclaration, ExportNamedDeclaration > VariableDeclaration, ExportNamedDeclaration > ClassDeclaration, ExportNamedDeclaration > FunctionDeclaration',
                    message:
                        'index.js is a barrel: re-export from src/ instead of declaring here. ' +
                        'Declarations invite internal modules to import the barrel, which is how the original import cycle formed.',
                },
            ],
        },
    },
    {
        files: ['test/**/*.mjs'],
        languageOptions: {ecmaVersion: 2022, sourceType: 'module'},
    },
];
