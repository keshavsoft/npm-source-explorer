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

1. **Keep It Simple & Focused:** The primary purpose is to take any npm package, discover all authentic upstream Git repositories behind it and its recursive dependencies, and clone them as sibling folders in your workspace.
2. **V8 is the Single Source of Truth:** `src/v8/` contains the modern, 4-act story-driven engine. Each act is separated into its own folder, while `index.js` acts strictly as the orchestrator.
3. **The 4-Act Story:**
   - **Act 1: The Gatekeeper (`1-gatekeeper/`)** — Validates the package specification and extracts package identity.
   - **Act 2: The Cartographer (`2-cartographer/`)** — Recursively resolves the full dependency tree in isolation.
   - **Act 3: The Detective (`3-detective/`)** — Extracts Git repository remotes, runs smart owner fallback for missing repos, and deduplicates.
   - **Act 4: The Builder (`4-builder/`)** — Shallow-clones each upstream repository as sibling folders with fail-safe timeouts and Windows process-tree termination.

---

## Directory Overview

```
npm-source-explorer/
├── cli/
│   └── index.js             # Intuitive CLI runner with timings and clear status output
├── docs/
│   ├── .nojekyll            # Prevents Jekyll build override on GitHub Pages
│   └── index.html           # Clean storytelling documentation website
├── src/
│   ├── index.js             # Root export (routes directly to v8)
│   └── v8/                  # The 4-Act Story Engine
│       ├── 1-gatekeeper/    # Act 1: Validation & identity
│       ├── 2-cartographer/  # Act 2: Isolated dependency resolution
│       ├── 3-detective/     # Act 3: Git provenance & owner fallback
│       ├── 4-builder/       # Act 4: Sibling cloning & fail-safes
│       └── index.js         # Pure 35-line Story Orchestrator
├── test/
│   └── helpers.test.js      # Unit tests for URL normalizers & naming
├── package.json             # Package configuration & metadata
├── README.md                # Project documentation
└── STRUCTURE.md             # Codebase layout and architecture reference
```

---

## V5 Module Breakdown

### 1. `src/v5/resolver.js` (Chapter 1: Discovery)
- Creates an isolated workspace in `os.tmpdir()` using `@npmcli/arborist`.
- Recursively traverses the dependency tree to discover every package, its version, and declared repository metadata.
- Automatically and safely cleans up the temporary directory when finished.

### 2. `src/v5/git.js` (Chapter 2 & 3: Git Remote & Shallow Clone)
- Converts varied repository URL configurations (`git+https`, SCP-style `git@github.com:...`, SSH, object with `.url`) into canonical HTTPS endpoints.
- Appends `.git` when necessary to prepare valid clone remotes.
- Executes `git clone --depth 1` with a fail-safe timeout (default 25s).
- On timeout, forcefully kills the child process tree (`taskkill /pid <PID> /T /F` on Windows) so hung helper processes (like `git-remote-https.exe`) never leave orphan background locks.

### 3. `src/v5/naming.js` (Sibling Folder Normalization)
- Converts scoped package names (e.g. `@keshavsoft/npm-source-explorer`) into clean, cross-platform sibling folder names (`keshavsoft-npm-source-explorer`).

### 4. `src/v5/story.js` (Narrative Reporter)
- Tracks timestamps, elapsed durations, and chapter transitions.
- Emits structured progress events to the CLI or programmatic API.

### 5. `src/v5/index.js` (SourceExplorer Orchestrator)
- Exposes `SourceExplorer` and `explore(packageSpec, destinationDirectory, options)`.
- Implements the complete 3-chapter journey with clean, readable methods.

---

## Related Links

- 🌐 **Documentation Site**: [keshavsoft.github.io/npm-source-explorer](https://keshavsoft.github.io/npm-source-explorer/)
- 📦 **npm**: [npmjs.com/package/@keshavsoft/npm-source-explorer](https://www.npmjs.com/package/@keshavsoft/npm-source-explorer)
- 🐙 **GitHub**: [github.com/keshavsoft/npm-source-explorer](https://github.com/keshavsoft/npm-source-explorer)
- 📄 **License**: [MIT License](https://github.com/keshavsoft/npm-source-explorer/blob/main/LICENSE)
