# Architecture & Source Layout

<p align="center">
  <a href="https://www.npmjs.com/package/@keshavsoft/npm-source-explorer">📦 <strong>npm Package</strong></a> •
  <a href="https://github.com/keshavsoft/npm-source-explorer">🐙 <strong>GitHub Repository</strong></a> •
  <a href="https://github.com/keshavsoft/npm-source-explorer#readme">📖 <strong>Documentation</strong></a> •
  <a href="https://github.com/keshavsoft/npm-source-explorer/issues">🐛 <strong>Issues</strong></a>
</p>

---

## Directory Overview

```
npm-source-explorer/
├── cli/
│   └── index.js             # Command-line interface (analyze, verify, clone)
├── src/
│   ├── index.js             # Main public entrypoint exporting V1 and V2 APIs
│   ├── v1/
│   │   └── index.js         # V1 engine: Isolated npm install via Arborist, dependency graph resolution
│   └── v2/
│       └── index.js         # V2 engine: Repository checks, Git version tag matching, and source cloning
├── test/
│   └── helpers.test.js      # Unit tests for URL normalization and helpers
├── LICENSE                  # MIT License
├── package.json             # Package configuration, bin scripts, exports, and metadata
├── README.md                # Documentation and usage guide for npm and GitHub
└── STRUCTURE.md             # Codebase layout and architecture reference
```

---

## Module Breakdown

### 1. `src/v1/index.js` (Dependency Graph Engine)
- Performs an isolated installation in a temporary OS directory using `@npmcli/arborist`.
- Traverses the entire resolved dependency node graph.
- Normalizes repository metadata across varying shapes (`git+https`, `git@github.com:...`, ssh, shortcuts).
- Outputs a comprehensive JSON report containing `target`, `summary`, `nodes`, `edges`, and `generatedAt`.

### 2. `src/v2/index.js` (Repository & Provenance Engine)
- Consumes a V1 dependency graph report.
- Performs asynchronous HTTP reachability checks on referenced repository URLs.
- Inspects remote Git tags (`git ls-remote --tags`) to verify if published versions match repository release tags (`vX.Y.Z` or `X.Y.Z`).
- Discovers distinct repositories and clones them locally via `git clone --depth 1` into the designated target folder.

### 3. `src/index.js` (Library Barrel Export)
- Exports the public programmatic API functions:
  - From V1: `analyzeDependencies`, `normalizeRepositoryUrl`, `getRepositoryInfo`
  - From V2: `verifyRepositories`, `checkRepository`, `cloneRepositories`

### 4. `cli/index.js` (Command-Line Interface)
- Executable bin entrypoint (`npm-source-explorer`) configured in `package.json`.
- Dispatches commands: `analyze`, `verify`, and `clone`.
- Supports CLI flags: `--out <file>`, `--clone-dir <dir>`, `--no-optional`, `--version`, and `--help`.

### 5. `test/helpers.test.js` (Unit Tests)
- Built on the native Node.js test runner (`node --test`).
- Tests repository URL normalization, SSH cleaning, and missing metadata handling.

---

## Related Links

- 📦 **npm**: [npmjs.com/package/@keshavsoft/npm-source-explorer](https://www.npmjs.com/package/@keshavsoft/npm-source-explorer)
- 🐙 **GitHub**: [github.com/keshavsoft/npm-source-explorer](https://github.com/keshavsoft/npm-source-explorer)
- 📄 **License**: [MIT License](https://github.com/keshavsoft/npm-source-explorer/blob/main/LICENSE)
