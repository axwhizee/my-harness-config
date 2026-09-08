---
name: vscode-ref
description: Reference for driving VS Code through the vscode-mcp-bridge MCP tools — execute_command, call_api, list_commands. Use when running a VS Code command by id, calling a vscode.* API path, encoding Uri/Position/Range arguments, understanding result shapes, or driving the debugger (breakpoints, stepping, inspection). Triggers include "vscode", "vs code", "vscode command", "workbench.action", "editor.action", "call vscode api", "vscode api", "debug in vscode".
---

# VS Code Reference (vscode-mcp-bridge)

Live reference for controlling VS Code through the three bridge tools. Every command id and API path below was verified against a running VS Code instance.

## 1. The three tools

### execute_command
Execute a VS Code command by id — same as running it in the Command Palette (Ctrl+Shift+P).
```json
{ "command": "editor.action.formatDocument" }
{ "command": "workbench.action.files.saveAll" }
{ "command": "workbench.action.debug.stepOver" }
```
Optional `args` (array) is passed through to the command.

### call_api
Call a function or read a property on the `vscode` module by dotted path. Only the LAST segment is invoked; intermediate segments are resolved as properties.
```json
{ "path": "workspace.workspaceFolders" }                  // read property
{ "path": "languages.getLanguages", "args": [] }          // call function (no args)
{ "path": "debug.activeDebugSession.customRequest", "args": ["threads", {}] }
```

### list_commands
Query command ids at runtime — ALWAYS use this instead of guessing an id.
```json
{ "query": "git", "maxResults": 50 }
{ "query": "terminal", "includeInternal": false }
```
Leave `query` empty only when you truly need everything (result is capped by `maxResults`).

## 2. Argument encoding (call_api)

Objects inside `args` can carry a `__vscode` marker to construct native objects:

| Marker   | JSON shape | For APIs expecting |
| -------- | ---------- | ------------------ |
| uri      | `{ "__vscode": "uri", "fsPath": "/path/file.ts" }` | a `Uri` (e.g. `workspace.getWorkspaceFolder`, `languages.getDiagnostics`, `window.showTextDocument`) |
| position | `{ "__vscode": "position", "line": 0, "character": 5 }` | a `Position` |
| range    | `{ "__vscode": "range", "start": {"line":0,"character":0}, "end": {"line":1,"character":0} }` | a `Range` |

- Only TOP-LEVEL elements of `args` are converted. Nested markers inside plain objects are NOT converted.
- `Uri.file` / `Uri.parse` take plain STRINGS, not the uri marker.
- Use the marker only for APIs that natively accept `Uri` / `Position` / `Range`.

## 3. Result shapes & resultType

`execute_command` returns:
```json
{ "ok": true, "command": "...", "resultType": "void|null|string|number|boolean|bigint|array[n]|Uri|Position|Range|...|object", "result": <serialized> }
{ "ok": false, "command": "...", "error": "Blocked by security mode | Rejected by user | <exception message>" }
```
`call_api` returns:
```json
{ "ok": true, "path": "...", "resultType": "void|null|string|number|boolean|array[n]|Uri|...|object", "result": <serialized> }
{ "ok": false, "path": "...", "error": "<exception message>" }
```
When a property exists but is currently `undefined` (e.g. `window.activeTextEditor` with no editor open), the call still succeeds with `resultType: "void"` and `result: null`.
Serialization notes:
- Promises are awaited automatically (async results are resolved).
- Functions and event emitters appear as `"[function]"`; circular references as `"[circular]"`.
- Large objects are summarized, e.g. `[object with 134 keys; first 10: ...]`.

## 4. Golden rules
1. NEVER guess a command id — run `list_commands` with a keyword first.
2. Read state before acting: `window.visibleTextEditors`, `workspace.workspaceFolders`, `workspace.getConfiguration`, `debug.breakpoints`.
3. Prefer `execute_command` for UI actions; `call_api` for reading and computing.
4. Only the last segment is invoked — build long paths like `window.activeTextEditor.document.getText`.
5. Event-subscription APIs (`onDid*`, `onDidChange*`) return a Disposable and will NOT give you events — do not call them expecting a value.

## 5. Known bridge limitations
- `SourceBreakpoint` / `DebugConfiguration` objects cannot be constructed from args yet (no marker). Use cursor-based commands (`editor.debug.action.toggleBreakpoint`) until dedicated debug tools exist.
- Reading the debug console output stream (DAP `output` events) is not possible via the public API — see section 8.

## 6. Verified command ids (live-checked)

**Discovery & navigation**
- `workbench.action.showCommands` — Command Palette
- `workbench.action.quickOpen` — file Quick Open
- `workbench.action.quickOpenRecent` — recent files
- `workbench.action.gotoLine` — go to line
- `workbench.action.openRecent` — open recent folder/file
- `workbench.action.reopenClosedEditor`
- `workbench.action.navigateBack` — jump back

**Files**
- `workbench.action.files.openFile` / `openFolder` / `openFolderInNewWindow`
- `workbench.action.files.save` / `saveAll` / `saveAs` / `saveWithoutFormatting`

**Settings & UI**
- `workbench.action.openSettings` — settings UI
- `workbench.action.openSettingsJson` — settings.json
- `workbench.action.closeActiveEditor`
- `workbench.action.revertAndCloseActiveEditor`
- `workbench.action.toggleSidebarVisibility`
- `workbench.action.togglePanel`
- `workbench.action.toggleWordWrap` (editor.action.toggleWordWrap)
- `workbench.action.closeWindow` (usually denied by default policy)
- `workbench.action.reloadWindow` (usually denied by default policy)

**Views**
- `workbench.view.explorer` / `workbench.view.scm` / `workbench.view.debug` / `workbench.view.search` / `workbench.view.extensions`

**Editor actions**
- `editor.action.formatDocument` — format current file
- `editor.action.sourceAction` — code actions menu (auto-fix etc.)
- `editor.action.quickFix` — quick fix
- `editor.action.rename` — rename symbol
- `editor.action.findReferences`
- `editor.action.peekDefinition`
- `editor.action.goToImplementation`
- `editor.action.marker.next` — jump to next problem
- `editor.action.addSelectionToNextFindMatch` — multi-cursor
- `editor.action.commentLine` / `addCommentLine` / `removeCommentLine`
- `editor.action.selectAll`
- `editor.action.deleteLines`
- `editor.action.copyLinesDownAction` / `copyLinesUpAction`
- `editor.action.moveLinesDownAction` / `moveLinesUpAction`

**Terminal**
- `terminal.focus` — focus the integrated terminal
- `workbench.action.terminal.new` — new terminal
- `workbench.action.terminal.clear`
- `workbench.action.terminal.focusNext` / `focusPrevious`

**Tasks & testing**
- `workbench.action.tasks.runTask`
- `testing.runAll` / `testing.runCurrentFile` / `testing.runAtCursor` / `testing.runUsing`

**Git**
- `git.stage` / `git.stageAll` / `git.stageFile` / `git.stageChange`
- `git.commit` / `git.commitAll` / `git.commitStaged`
- `git.push` / `git.pushForce` / `git.pushTo`
- `git.sync` / `git.syncRebase`
- `git.checkout`
- `git.diff.stageSelection` / `git.diff.stageHunk`

## 7. Verified API paths (live-checked)

| Path | Kind | Result |
| ---- | ---- | ------ |
| `workspace.workspaceFolders` | property | `WorkspaceFolder[]` (name, index, uri) |
| `workspace.getConfiguration` | call | configuration object (summarized) |
| `workspace.getWorkspaceFolder` | call (uri) | `WorkspaceFolder` or undefined |
| `window.visibleTextEditors` | property | `TextEditor[]` |
| `window.tabGroups` | property | active tab group / tabs with labels |
| `window.activeTextEditor` | property | `TextEditor` or `void` (null) when no editor open |
| `languages.getLanguages` | call | registered language ids |
| `env.appName` / `env.language` | property | product name / UI language |
| `debug.breakpoints` | property | current breakpoints |
| `debug.activeDebugSession` | property | `DebugSession` or `void` (null) when no session |
| `Uri.file` | call (string) | `Uri` from a filesystem path |
| `Uri.parse` | call (string) | `Uri` from a URI string |

## 8. Debugging workflow (with existing tools)

### Start / stop / restart
- `workbench.action.debug.run` — run without prompting (F5)
- `workbench.action.debug.start` — start the selected configuration
- `workbench.action.debug.stop` / `workbench.action.debug.disconnect`
- `workbench.action.debug.restart`
- `workbench.action.debug.configure` — open launch.json

### Breakpoints
- `editor.debug.action.toggleBreakpoint` — toggle at cursor (do this before starting)
- `editor.debug.action.runToCursor`
- Read state: `debug.breakpoints`

### Stepping & pause
- `workbench.action.debug.pause` / `workbench.action.debug.continue`
- `workbench.action.debug.stepOver` / `stepInto` / `stepOut`

### Inspect via DAP (`call_api` + `customRequest`)
Once a session is active, `debug.activeDebugSession` resolves. Drive the Debug Adapter Protocol through `customRequest`:
```json
{ "path": "debug.activeDebugSession.customRequest", "args": ["threads", {}] }
{ "path": "debug.activeDebugSession.customRequest", "args": ["stackTrace", { "threadId": 1, "startFrame": 0, "levels": 10 }] }
{ "path": "debug.activeDebugSession.customRequest", "args": ["scopes", { "frameId": 0 }] }
{ "path": "debug.activeDebugSession.customRequest", "args": ["variables", { "variablesReference": 1 }] }
{ "path": "debug.activeDebugSession.customRequest", "args": ["evaluate", { "expression": "myVar", "frameId": 0, "context": "watch" }] }
{ "path": "debug.activeDebugSession.customRequest", "args": ["next", { "threadId": 1 }] }
```
Chain of ids: `threads` → `threadId`; `stackTrace` → `frameId`; `scopes` → `variablesReference`; `variables`/`evaluate` consume those ids.
- `evaluate` only works while paused (breakpoint hit or manual pause).
- Lifecycle: with no event subscription available, confirm state by re-reading `debug.activeDebugSession` and `debug.breakpoints` after each action.

### Not possible yet (Phase 1)
- Reading the console/output stream (needs a debug-adapter wrapper — planned dedicated tools).
- Precise line breakpoints without cursor (use toggle-breakpoint at the target line).

## 9. Common pitfalls
- Expecting a result from `onDid*` subscriptions — they return a `Disposable`, not events.
- Calling `window.activeTextEditor.document.getText` while no editor is open — every path segment must be non-undefined first.
- Forgetting `args: []` on functions that take no arguments — omit it only for property reads.
- Passing the `__vscode:uri` marker to `Uri.file`/`Uri.parse`, which want plain strings.
