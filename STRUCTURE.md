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

1. **Keep It Simple & Focused:** The primary goal is to take any npm package and download the authentic upstream Git source code of it and all its dependencies as sibling folders in your workspace.
2. **V3 is the Single Source of Truth:** `src/v3/` contains the lean, modern implementation. The CLI and root barrel export invoke V3 directly.
3. **No Bloat, Zero Legacy Coupling:** V3 does not import or depend on V1 or V2. The entire V3 implementation is under 7 KB across 3 single-purpose files.

---

## Directory Overview

```
npm-source-explorer/
├── cli/
│   └── index.js             # CLI runner: handles npx <package-spec> [destination]
├── docs/
│   ├── .nojekyll            # Prevents Jekyll build override on GitHub Pages
│   └── index.html           # Interactive storytelling documentation website
├── src/
│   ├── index.js             # Root export (routes to v3)
│   └── v3/                  # Lean, Single-Purpose Engine
│       ├── git.js           # Normalizes repository URLs and runs shallow git clone
│       ├── resolver.js      # Uses Arborist to recursively discover dependency repo URLs
│       └── index.js         # exploreAndClone workflow orchestrator
├── test/
│   └── helpers.test.js      # Unit tests for URL normalizers
├── package.json             # Package configuration & metadata
├── README.md                # Project documentation
└── STRUCTURE.md             # Codebase layout and architecture reference
```

---

## V3 Module Breakdown

### 1. `src/v3/resolver.js` (Dependency Discovery)
- Creates an isolated workspace in `os.tmpdir()` using `@npmcli/arborist`.
- Recursively traverses the dependency tree to discover every package and its declared repository metadata.
- Automatically cleans up the temporary directory when finished.

### 2. `src/v3/git.js` (Git Normalization & Cloning)
- Converts varied repository URL configurations (`git+https`, SCP-style `git@github.com:...`, SSH, object with `.url`) into canonical HTTPS endpoints.
- Appends `.git` when necessary to prepare valid clone remotes.
- Spawns `git clone --depth 1` to quickly pull the latest commit of each repository without bloating disk usage with full Git history.

### 3. `src/v3/index.js` (Pipeline Orchestrator)
- Exposes `exploreAndClone(packageSpec, destinationDirectory, options)`.
- De-duplicates repositories across dependencies.
- Clones them side-by-side as siblings in the chosen directory (defaults to `process.cwd()`).
- Skips existing folders safely and emits progress events.

### 4. `cli/index.js` (Command-Line Interface)
- Enables `npx @keshavsoft/npm-source-explorer <package-name> [destination]`.
- Prints real-time terminal progress with clean emoji indicators.

---

## Related Links

- 🌐 **Documentation Site**: [keshavsoft.github.io/npm-source-explorer](https://keshavsoft.github.io/npm-source-explorer/)
- 📦 **npm**: [npmjs.com/package/@keshavsoft/npm-source-explorer](https://www.npmjs.com/package/@keshavsoft/npm-source-explorer)
- 🐙 **GitHub**: [github.com/keshavsoft/npm-source-explorer](https://github.com/keshavsoft/npm-source-explorer)
- 📄 **License**: [MIT License](https://github.com/keshavsoft/npm-source-explorer/blob/main/LICENSE)
