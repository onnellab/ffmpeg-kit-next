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

// Structural guard for the binding layer's import graph.
//
// A cycle between index.js and FFmpegKitFactory.js once made the package throw
// `ReferenceError: Cannot access 'LogRedirectionStrategy' before initialization`
// on import, because a module-scope const read an enum from a module that was
// still evaluating. These tests fail the build if that shape comes back.
//
// Deliberately dependency-free so it runs with plain `node --test`, with no npm
// install. `npm run lint` enforces the same rule through import/no-cycle for
// editor integration.

import assert from 'node:assert/strict';
import {readdirSync, readFileSync, statSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const WEB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const JS_ROOT = path.join(WEB_ROOT, 'js');
const BINDINGS = path.join(WEB_ROOT, 'src/FFmpegKitBindings.cpp');

function listModules(dir) {
    const out = [];
    for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) out.push(...listModules(full));
        else if (entry.endsWith('.js')) out.push(full);
    }
    return out;
}

// Collects static import/re-export specifiers. Dynamic import() is intentionally
// ignored: it defers evaluation, so it cannot produce the TDZ failure this guards.
function staticSpecifiers(source) {
    const specifiers = [];
    const pattern = /(?:^|\n)\s*(?:import|export)\b[^;\n]*?from\s*['"]([^'"]+)['"]|(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g;
    let match;
    while ((match = pattern.exec(source)) !== null) {
        specifiers.push(match[1] ?? match[2]);
    }
    return specifiers;
}

function buildGraph() {
    const graph = new Map();
    for (const file of listModules(JS_ROOT)) {
        const source = readFileSync(file, 'utf8');
        const edges = [];
        for (const specifier of staticSpecifiers(source)) {
            if (!specifier.startsWith('.')) continue; // bare/package specifier
            const resolved = path.resolve(path.dirname(file), specifier);
            // The worker imports ../lib/libffmpegkit.js, a build artefact that is
            // not present in the source tree.
            if (resolved.startsWith(JS_ROOT)) edges.push(resolved);
        }
        graph.set(file, edges);
    }
    return graph;
}

const rel = (file) => path.relative(JS_ROOT, file);

test('the import graph is acyclic', () => {
    const graph = buildGraph();
    const state = new Map(); // file -> 'visiting' | 'done'
    const cycles = [];

    function visit(file, stack) {
        if (state.get(file) === 'done') return;
        if (state.get(file) === 'visiting') {
            cycles.push([...stack.slice(stack.indexOf(file)), file].map(rel).join(' -> '));
            return;
        }
        state.set(file, 'visiting');
        for (const next of graph.get(file) ?? []) visit(next, [...stack, next]);
        state.set(file, 'done');
    }

    for (const file of graph.keys()) visit(file, [file]);

    assert.deepEqual(
        cycles,
        [],
        `Import cycle(s) detected. A cycle makes module-scope evaluation order ` +
        `fragile and can resurface the TDZ crash:\n  ${cycles.join('\n  ')}`
    );
});

test('modules marked LEAF MODULE import nothing', () => {
    const offenders = [];
    for (const [file, edges] of buildGraph()) {
        const source = readFileSync(file, 'utf8');
        if (!source.includes('LEAF MODULE')) continue;
        const bare = staticSpecifiers(source).filter((s) => !s.startsWith('.'));
        if (edges.length > 0 || bare.length > 0) {
            offenders.push(`${rel(file)} imports ${[...edges.map(rel), ...bare].join(', ')}`);
        }
    }
    assert.deepEqual(
        offenders,
        [],
        `Leaf modules must stay import-free so their exports are always initialized:\n  ${offenders.join('\n  ')}`
    );
});

test('index.js is a pure barrel with no declarations', () => {
    const source = readFileSync(path.join(JS_ROOT, 'index.js'), 'utf8');
    const declarations = source
        .split('\n')
        .filter((line) => /^\s*(export\s+)?(class|function|const|let|var)\s/.test(line))
        // `export { X } from './y.js'` is a re-export, not a declaration.
        .filter((line) => !/^\s*export\s*\{/.test(line));
    assert.deepEqual(
        declarations,
        [],
        'index.js must only re-export. A declaration here invites internal modules ' +
        'to import the barrel, which is how the original cycle formed.'
    );
});

// ---- Enum boundary -------------------------------------------------------------
//
// Every C++ enum must cross every boundary as a plain number, exactly as they do over
// the Flutter and React Native platform channels. embind exposes an unscoped C++ enum
// as a value OBJECT whose `value` property is non-enumerable, so binding one directly
// breaks the API in both directions and does it silently:
//   - returned: structured clone drops the non-enumerable property, so the main
//     thread receives `{}`. Log.getLevel() becomes unusable, Level.levelToString()
//     returns '', and Number({}) is NaN, which disables the level filter entirely.
//     For SessionState the worker's own comparisons go first: stateToNumber() reports
//     every session as Created and sessionDone() never becomes true, so waitForSession
//     - which has no timeout by design - polls forever and execute() never settles.
//   - passed in: toWireType reads `value.value` on a number -> undefined -> 0, i.e.
//     setLogLevel(AV_LOG_INFO) silently sets AV_LOG_PANIC.
// Both regressions are invisible to behavioural tests, whose fake workers post
// numbers, so they are pinned structurally here.

test('the wasm bindings keep C++ enums off the JS boundary', () => {
    const source = readFileSync(BINDINGS, 'utf8');
    for (const [symbol, shim] of [
        ['&Log::getLevel', 'log_getLevel'],
        ['&FFmpegKitConfig::getLogLevel', 'config_getLogLevel'],
        ['&FFmpegKitConfig::setLogLevel', 'config_setLogLevel'],
        ['&AbstractSession::getState', 'session_getState'],
    ]) {
        assert.ok(
            !source.includes(symbol),
            `FFmpegKitBindings.cpp binds ${symbol} directly, which puts an embind ` +
            `enum value object on the JS boundary. Bind the int wrapper instead (${shim}).`
        );
    }
});

// The worker must not reach for Module.SessionState either: comparing against those
// value objects is what broke when getState() was bound as an enum, and the int
// bindings make the lookup unnecessary.
test('the worker compares session state as numbers', () => {
    const source = readFileSync(path.join(JS_ROOT, 'ffmpegkit.worker.js'), 'utf8');
    const offenders = source
        .split('\n')
        .map((line, index) => [index + 1, line])
        .filter(([, line]) => /Module\.SessionState/.test(line))
        .filter(([, line]) => !line.trim().startsWith('//'))
        .map(([number, line]) => `${number}: ${line.trim()}`);

    assert.deepEqual(
        offenders,
        [],
        'Session state must be normalized with stateToNumber() and compared against the ' +
        `SESSION_STATE_* constants, never against Module.SessionState:\n  ${offenders.join('\n  ')}`
    );
});

test('the worker posts log levels as numbers', () => {
    const source = readFileSync(path.join(JS_ROOT, 'ffmpegkit.worker.js'), 'utf8');
    const offenders = source
        .split('\n')
        .map((line, index) => [index + 1, line])
        .filter(([, line]) => /\.getLevel\(\)/.test(line))
        .filter(([, line]) => !line.trim().startsWith('//'))
        .filter(([, line]) => !/(levelToNumber|enumToNumber)\([^)]*\.getLevel\(\)\)/.test(line))
        .map(([number, line]) => `${number}: ${line.trim()}`);

    assert.deepEqual(
        offenders,
        [],
        'Every getLevel() read in the worker must go through levelToNumber() before ' +
        `it is posted, or the level arrives as {} on the main thread:\n  ${offenders.join('\n  ')}`
    );
});

// The getArguments version guard must OMIT the key when the binding is missing. Both
// consumers on the host side treat an empty array as a real answer - AbstractSession._apply()
// overwrites when the key IS an array, _applySessionMap() reparses the command only when it
// is NOT one - so a ternary yielding [] wipes the arguments instead of triggering the
// fallback the guard exists for. Contrast sessionMillis(), where 0 is a meaningful "unset".
test('the worker omits arguments rather than sending an empty array', () => {
    const source = readFileSync(path.join(JS_ROOT, 'ffmpegkit.worker.js'), 'utf8');
    const offenders = source
        .split('\n')
        .map((line, index) => [index + 1, line])
        .filter(([, line]) => !line.trim().startsWith('//'))
        .filter(([, line]) => /getArguments\s*===\s*'function'\s*\?/.test(line))
        .map(([number, line]) => `${number}: ${line.trim()}`);

    assert.deepEqual(
        offenders,
        [],
        'The getArguments guard must omit the arguments key, not fall back to a ternary ' +
        `that yields [] - an empty array defeats the parseArguments fallback:\n  ${offenders.join('\n  ')}`
    );
});

test('FFmpegKitFactory does not import a session class', () => {
    const source = readFileSync(path.join(JS_ROOT, 'src/FFmpegKitFactory.js'), 'utf8');
    for (const sessionModule of [
        './AbstractSession.js',
        './FFmpegSession.js',
        './FFprobeSession.js',
        './MediaInformationSession.js',
    ]) {
        assert.ok(
            !source.includes(sessionModule),
            `FFmpegKitFactory imports ${sessionModule}. Sessions call getFactory(), so ` +
            'this closes a cycle — construct them via SessionRegistry.createSession() instead.'
        );
    }
});

// ---- Worker-side invariants that need the real wasm module to exercise -----------
//
// The three below live in the worker's native calls, so a fake worker cannot reach
// them. They are pinned structurally instead.

// Every I/O op must reject an unknown handle. Returning a neutral value is worse than
// useless on the streaming ops: 0 bytes written and a null read both mean "retry", so a
// caller that used a closed handle would spin forever instead of seeing the mistake.
test('the worker rejects unknown I/O handles instead of faking backpressure', () => {
    const source = readFileSync(path.join(JS_ROOT, 'ffmpegkit.worker.js'), 'utf8');
    const guarded = [
        'ioGetSize',
        'ioOutputBytes',
        'ioStreamWrite',
        'ioStreamCloseInput',
        'ioStreamRead',
    ];

    for (const op of guarded) {
        const body = source.split(`case '${op}': {`)[1]?.split('break;')[0];
        assert.ok(body, `worker has no '${op}' op`);
        assert.match(
            body,
            /requireIoObject\(/,
            `The '${op}' op must resolve its handle through requireIoObject(), so a closed ` +
            'or unknown handle throws rather than being reported as backpressure.'
        );
    }

    // ioClose stays idempotent - closing twice must not throw.
    const closeBody = source.split("case 'ioClose': {")[1].split('break;')[0];
    assert.doesNotMatch(closeBody, /requireIoObject\(/);
});

// messagesInTransmit has to mean "not delivered to the JS callbacks yet" on web too.
// Native decrements its counter as soon as the buffering callback returns, so the count
// has to include the events still sitting in the wasm buffer awaiting a drain.
test('messagesInTransmit counts events still waiting to be drained', () => {
    const workerSource = readFileSync(path.join(JS_ROOT, 'ffmpegkit.worker.js'), 'utf8');
    const bindingsSource = readFileSync(BINDINGS, 'utf8');

    assert.match(
        workerSource,
        /Number\(Module\.FFmpegKitConfig\.messagesInTransmit\(sessionId\)\) \+\s*pendingEventCount\(sessionId\)/,
        'The worker must add the undrained event count to the native in-transit count.'
    );
    assert.ok(
        bindingsSource.includes('function("_ffmpegkitPendingEventCount"'),
        'FFmpegKitBindings.cpp must expose _ffmpegkitPendingEventCount for that count.'
    );
});

// The wait for messages in transmit belongs to the worker thread, not to native.
//
// This used to assert the opposite - that the getAll* ops call native's
// getAll*WithTimeout(), on the reasoning that native already implements the wait. That
// reasoning does not survive contact with the worker. Native's wait
// (AbstractSession::waitForAsynchronousMessagesInTransmit) sleeps the calling thread, and
// the caller here is the single thread running the worker event loop, so it stops cancel
// handling, ffkitstream: I/O and the drain that feeds live log/statistics callbacks. It
// also cannot finish its own job: on web the in-transit count includes events buffered in
// C++ that only this thread can drain, so blocking holds the one thread able to make the
// count fall.
//
// So: no waiting native getter may be bound or called, and the worker must poll instead,
// draining on every tick.
test('the getAll* ops wait on the worker thread, never inside native', () => {
    const workerSource = readFileSync(path.join(JS_ROOT, 'ffmpegkit.worker.js'), 'utf8');
    const bindingsSource = readFileSync(BINDINGS, 'utf8');

    // Every getAll* op goes through withHistorySession(), which awaits the poll.
    for (const [op, getter] of [
        ['getAllLogs', 'getLogs()'],
        ['getAllLogsAsString', 'getLogsAsString()'],
        ['getAllStatistics', 'getStatistics()'],
    ]) {
        const body = workerSource.split(`case '${op}': {`)[1]?.split('break;')[0];
        assert.ok(body, `worker has no '${op}' op`);
        assert.match(
            body,
            /await withHistorySession\(/,
            `The '${op}' op must await withHistorySession(), which owns the wait.`
        );
        assert.ok(
            body.includes(`session.${getter}`),
            `The '${op}' op must read through the non-waiting session.${getter}.`
        );
    }

    // The poll itself: bounded by the caller's waitTimeout, and draining every tick so the
    // undrained-event half of the count can actually reach zero.
    const wait = workerSource
        .split('function waitForMessagesInTransmit(')[1]
        ?.split('\n}')[0];
    assert.ok(wait, 'the worker must implement waitForMessagesInTransmit()');
    assert.match(wait, /drainAndForward\(id\)/, 'the poll must drain on every tick');
    assert.match(wait, /messagesInTransmit\(sessionId\)/);
    assert.match(wait, /setTimeout\(/, 'the wait must yield to the event loop, not block');
    assert.match(
        workerSource,
        /await waitForMessagesInTransmit\(id, sessionId, waitTimeout\(args\)\)/,
        "withHistorySession() must bound the wait by the caller's waitTimeout."
    );

    // Nothing that blocks the calling thread may be reachable from JS.
    for (const blocking of [
        'getAllLogs',
        'getAllLogsWithTimeout',
        'getAllLogsAsString',
        'getAllLogsAsStringWithTimeout',
        'getAllStatistics',
        'getAllStatisticsWithTimeout',
        'getOutput',
    ]) {
        assert.ok(
            !bindingsSource.includes(`.function("${blocking}"`),
            `FFmpegKitBindings.cpp must not bind ${blocking}(): it waits on the calling ` +
                'thread, which on web is the worker event loop.'
        );
    }
});

// Native's parser returns a MediaInformation for anything it can parse, so `{}` comes
// back as an empty one rather than as failure. The Flutter and React Native parsers make
// the distinction on their side of the bridge - from() nulls an empty result, while
// fromWithError() hands it back and reserves failure for input that does not parse. On
// web that decision has to be made in the worker, on the raw properties: once
// serializeMediaInformation() has added its streams/chapters/format defaults, an empty
// parse result is indistinguishable from a real one with no top-level members.
test('only the parser entry point that nulls an empty result asks for it', () => {
    const workerSource = readFileSync(path.join(JS_ROOT, 'ffmpegkit.worker.js'), 'utf8');

    const opBody = (op) => {
        const body = workerSource.split(`case '${op}': {`)[1]?.split('break;')[0];
        assert.ok(body, `worker has no '${op}' op`);
        return body;
    };

    assert.match(
        opBody('mediaInformationJsonParserFrom'),
        /serializeParsedMediaInformation\(info, \{ nullWhenEmpty: true \}\)/,
        'from() must report an empty parse result as null, like the other plugins.'
    );
    assert.ok(
        !opBody('mediaInformationJsonParserFromWithError').includes('nullWhenEmpty'),
        'fromWithError() must return the empty result, not turn it into a failure.'
    );

    // The check has to run before the serializer fills in its defaults.
    const serializer = workerSource
        .split('function serializeParsedMediaInformation(')[1]
        ?.split('\n}')[0];
    assert.ok(serializer, 'the worker must implement serializeParsedMediaInformation()');
    assert.ok(
        serializer.indexOf('hasParsedProperties(info)') <
            serializer.indexOf('serializeMediaInformation(info)'),
        'Emptiness must be decided on the raw properties, before the format/streams/' +
            'chapters defaults are added.'
    );
});
