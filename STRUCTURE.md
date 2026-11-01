# Architecture & Source Layout

<p align="center">
  <a href="https://keshavsoft.github.io/npm-source-explorer/">🌐 <strong>Live Documentation</strong></a> •
  <a href="https://www.npmjs.com/package/@keshavsoft/npm-source-explorer">📦 <strong>npm Package</strong></a> •
  <a href="https://github.com/keshavsoft/npm-source-explorer">🐙 <strong>GitHub Repository</strong></a> •
  <a href="https://github.com/keshavsoft/npm-source-explorer#readme">📖 <strong>README</strong></a> •
  <a href="https://github.com/keshavsoft/npm-source-explorer/issues">🐛 <strong>Issues</strong></a>
</p>

---

## Architecture Philosophy

1. **Keep It Simple & Focused:** Take any npm package specification, discover all authentic upstream Git repositories behind it and its recursive dependencies, and shallow-clone them as sibling folders in your workspace.
2. **V9 Engine as Decoupled Orchestrator:** `src/v9/` implements the modern orchestrator that imports `npm-repo-resolver` (dependency tree & Source of Truth) and `git-sibling-cloner` (sibling workspace builder).
3. **Preserved History & Backward Compatibility:** `src/v8/` is retained for backwards compatibility, with subpath export `"./v8"` and root exports pointing to `"./v9"`.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          The 4-Act Story                               │
├─────────────────┬──────────────────────┬───────────────────────────────┤
│ Act 1           │ Act 2                │ Act 3                         │
│ The Gatekeeper  │ The Cartographer     │ The Detective                 │
│ (Validate Spec) │ (Map Dependency Tree)│ (Git Provenance & Deduplicate)│
└────────┬────────┴──────────┬───────────┴──────────────┬────────────────┘
         │                   │                          │
         ▼                   ▼                          ▼
  ┌───────────────────────────────────────────────────────────┐
  │                 THE SOURCE OF TRUTH                       │
  │     (Canonical Git Provenance Manifest - JSON Array)      │
  └──────────────────────────┬────────────────────────────────┘
                             │
                             ▼
  ┌───────────────────────────────────────────────────────────┐
  │ Act 4: The Builder                                        │
  │ (Fail-Safe Shallow Sibling Cloning & Process Management)  │
  └──────────────────────────┬────────────────────────────────┘
                             │
                             ▼
  ┌───────────────────────────────────────────────────────────┐
  │ Workspace: Sibling Repositories Ready for Side-by-Side    │
  └───────────────────────────────────────────────────────────┘
```

---

## Directory Overview

```
npm-source-explorer/
├── cli/
│   └── index.js             # User-facing CLI runner with timings and clear status output
├── docs/
│   ├── .nojekyll            # Prevents Jekyll build override on GitHub Pages
│   └── index.html           # Storytelling documentation website (GitHub Pages)
├── src/
│   ├── index.js             # Root library export (re-exports v9 engine)
│   ├── v8/                  # Historical V8 4-Act Story Engine (monolithic)
│   │   ├── 1-gatekeeper/
│   │   ├── 2-cartographer/
│   │   ├── 3-detective/
│   │   ├── 4-builder/
│   │   └── index.js
│   └── v9/                  # Modern V9 Decoupled Orchestrator
│       └── index.js         # Composes npm-repo-resolver and git-sibling-cloner
├── test/
│   └── helpers.test.js      # Unit tests for URL normalizers, scope parsing & naming
├── package.json             # Package configuration, npm metadata & exports
├── README.md                # Project documentation & the developer story
└── STRUCTURE.md             # Codebase layout and architecture reference
```

---

## V8 Story Engine Breakdown

### Act 1: The Gatekeeper (`src/v8/1-gatekeeper/index.js`)
- Validates that the input package specification is a non-empty string.
- Parses scoped vs unscoped names (e.g. `@keshavsoft/json-renderers@1.2.0` vs `express`).
- Extracts package identity: `name`, `version`, `scope`, and GitHub `owner` context.

### Act 2: The Cartographer (`src/v8/2-cartographer/index.js`)
- Creates an ephemeral, isolated sandbox directory in `os.tmpdir()`.
- Uses `@npmcli/arborist` to compute the actual dependency graph without executing lifecycle install scripts or polluting user disk.
- Recursively walks `tree.children` to extract every dependency node, version, and declared `repository` metadata.
- Guarantees 100% cleanup of the temporary sandbox via `finally`.

### Act 3: The Detective (`src/v8/3-detective/index.js`)
- Normalizes diverse Git repository formats (`git+https`, SCP-style `git@github.com:...`, SSH, and object literals) into canonical HTTPS URLs.
- Appends `.git` to form valid clone remotes.
- Converts scoped package names into safe sibling directory names (e.g. `@keshavsoft/json-renderers` -> `keshavsoft-json-renderers`).
- **Smart Owner Fallback:** When a monorepo or internal package omits the `"repository"` field in its `package.json`, detects the primary GitHub organization/owner from sibling packages and synthesizes the fallback URL.
- Deduplicates distinct Git repositories so shared monorepo packages are cloned only once.
- **Output:** Produces the canonical **Source of Truth** manifest.

### Act 4: The Builder (`src/v8/4-builder/index.js`)
- Takes the **Source of Truth** manifest and prepares the target destination directory.
- Skips packages already present on disk to support safe incremental reruns.
- Executes `git clone --depth 1` with a fail-safe timeout (default 25 seconds).
- Disables interactive credentials (`GIT_TERMINAL_PROMPT=0`, `GIT_ASKPASS=echo`) to prevent frozen terminals on private or deleted repositories.
- **Cross-Platform Process Tree Killing:** On timeout or error, terminates the full process tree (`taskkill /pid <PID> /T /F` on Windows; `SIGKILL` on POSIX) to prevent orphaned `git-remote-https.exe` locks.
- Emits real-time progress events for CLI rendering.

---

## The Source of Truth: Data Contract

Between Act 3 (The Detective) and Act 4 (The Builder) lies a clean data boundary:

```json
[
  {
    "name": "@keshavsoft/npm-source-explorer",
    "version": "1.8.2",
    "repoUrl": "https://github.com/keshavsoft/npm-source-explorer",
    "cloneUrl": "https://github.com/keshavsoft/npm-source-explorer.git",
    "folder": "keshavsoft-npm-source-explorer",
    "isInferred": false
  }
]
```

This strict JSON contract allows the discovery pipeline (Acts 1–3) to be fully independent of the cloning pipeline (Act 4).

---

## Decoupling Blueprint: Dividing into Two Repositories

Because Acts 1–3 and Act 4 share only this pure data contract, the repository is ready to be split cleanly into two independent packages/repositories:

### 1. Repository A: `@keshavsoft/npm-repo-resolver` (The Source of Truth)
- **Scope:** Acts 1, 2, and 3 (`1-gatekeeper`, `2-cartographer`, `3-detective`).
- **Dependencies:** `@npmcli/arborist`. Zero Git or child process dependencies.
- **Output:** Outputs the Source of Truth JSON manifest.
- **CLI:** `npx @keshavsoft/npm-repo-resolver express` (prints JSON or Markdown table).
- **Use Cases:** Fast dependency auditing, security SBOM analysis, license checking, CI checks without downloading gigabytes of source code.

### 2. Repository B: `@keshavsoft/git-sibling-cloner` (The Workspace Builder)
- **Scope:** Act 4 (`4-builder`).
- **Dependencies:** Node.js native (`child_process`, `fs`). Zero npm or Arborist dependencies.
- **Input:** Any array of `{ cloneUrl, folder }` or path to a JSON manifest.
- **CLI:** `npx @keshavsoft/git-sibling-cloner manifest.json` or reading from standard input.
- **Use Cases:** Generic sibling cloner for GitHub teams, monorepos, Cargo/Go dependencies, or any custom repository list.

### 3. Orchestrator / Top-Level CLI: `@keshavsoft/npm-source-explorer`
- Stays as the flagship developer tool:
  ```bash
  # All-in-one developer experience:
  npx @keshavsoft/npm-source-explorer <package-name>
  
  # Or via UNIX composability:
  npx @keshavsoft/npm-repo-resolver express | npx @keshavsoft/git-sibling-cloner
  ```

---

## Related Links

- 🌐 **Documentation Site**: [keshavsoft.github.io/npm-source-explorer](https://keshavsoft.github.io/npm-source-explorer/)
- 📦 **npm Package**: [npmjs.com/package/@keshavsoft/npm-source-explorer](https://www.npmjs.com/package/@keshavsoft/npm-source-explorer)
- 🐙 **GitHub Repository**: [github.com/keshavsoft/npm-source-explorer](https://github.com/keshavsoft/npm-source-explorer)
- 📖 **README**: [`README.md`](https://github.com/keshavsoft/npm-source-explorer/blob/main/README.md)
- 📄 **License**: [MIT License](https://github.com/keshavsoft/npm-source-explorer/blob/main/LICENSE)
