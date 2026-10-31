# @keshavsoft/npm-source-explorer

<p align="center">
  <strong>Analyze npm dependency graphs and inspect the source repositories behind published packages.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@keshavsoft/npm-source-explorer"><img src="https://img.shields.io/npm/v/@keshavsoft/npm-source-explorer.svg?style=flat-square&color=cb3837" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@keshavsoft/npm-source-explorer"><img src="https://img.shields.io/npm/dm/@keshavsoft/npm-source-explorer.svg?style=flat-square&color=blue" alt="npm downloads" /></a>
  <a href="https://github.com/keshavsoft/npm-source-explorer"><img src="https://img.shields.io/github/stars/keshavsoft/npm-source-explorer.svg?style=flat-square&logo=github" alt="GitHub stars" /></a>
  <a href="https://github.com/keshavsoft/npm-source-explorer/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@keshavsoft/npm-source-explorer.svg?style=flat-square" alt="license" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/node/v/@keshavsoft/npm-source-explorer.svg?style=flat-square" alt="node version" /></a>
</p>

<p align="center">
  <a href="https://keshavsoft.github.io/npm-source-explorer/">🌐 <strong>Documentation Website</strong></a> •
  <a href="https://www.npmjs.com/package/@keshavsoft/npm-source-explorer">📦 <strong>View on npm</strong></a> •
  <a href="https://github.com/keshavsoft/npm-source-explorer">🐙 <strong>GitHub Repository</strong></a> •
  <a href="https://github.com/keshavsoft/npm-source-explorer/issues">🐛 <strong>Report Issue</strong></a> •
  <a href="#quick-start">🚀 <strong>Quick Start</strong></a>
</p>

---

## Overview

When auditing or researching third-party packages, knowing what code is running and where it originates is critical. **`npm-source-explorer`** provides deep visibility into an npm package's resolved dependency tree and inspects the underlying Git repositories referenced across dependencies.

- **V1 (Dependency Graph Engine)**: Installs the target package into an isolated temporary workspace using `@npmcli/arborist`, walks the complete resolved dependency tree, normalizes repository URLs, and exports structured JSON.
- **V2 (Repository & Provenance Engine)**: Extends V1 by checking remote repository HTTP availability, testing whether the published version matches Git release tags (e.g. `v1.2.0` or `1.2.0`), and automatically cloning the distinct source repositories for local inspection.

---

## Requirements

- **Node.js**: `>=20.0.0`
- **npm**: Installed and available in PATH
- **Git**: Installed and available in PATH *(required for `verify` and `clone` commands)*

---

## Quick Start

You can run `npm-source-explorer` instantly without installing it globally using `npx`:

```bash
# 1. Analyze and extract the full dependency tree
npx @keshavsoft/npm-source-explorer analyze <package-name>

# 2. Verify repository links and Git version tags
npx @keshavsoft/npm-source-explorer verify <package-name>

# 3. Clone all distinct source repositories across dependencies
npx @keshavsoft/npm-source-explorer clone <package-name>
```

---

## Installation

### Global CLI

```bash
npm install -g @keshavsoft/npm-source-explorer
```

### Local Project Dependency

```bash
npm install @keshavsoft/npm-source-explorer
```

---

## CLI Reference

```
npm-source-explorer <command> <package-spec> [options]
```

### Commands

| Command | Description |
| :--- | :--- |
| `analyze` | Resolves the dependency graph in isolation and outputs structured JSON metadata. |
| `verify` | Performs HTTP reachability checks and verifies remote Git version tags for every dependency. |
| `clone` | Discovers all distinct Git repositories across the tree and clones them locally. |

### Global & Command Options

| Option | Default | Description |
| :--- | :--- | :--- |
| `--out <file>` | `stdout` | Write JSON output to the specified file path. |
| `--clone-dir <dir>` | `./npm-source-explorer-sources` | Target directory when running the `clone` command. |
| `--no-optional` | `false` | Exclude optional dependencies from the resolution graph. |
| `-h, --help` | — | Display CLI command assistance. |
| `-v, --version` | — | Display the current installed version. |

### CLI Usage Examples

```bash
# Analyze a package and save the structured graph report
npx @keshavsoft/npm-source-explorer analyze json-renderers --out ./reports/deps.json

# Verify repository URLs and Git tags for React and its dependencies
npx @keshavsoft/npm-source-explorer verify react --out ./reports/react-verify.json

# Clone all repositories referenced by Lodash into a custom directory
npx @keshavsoft/npm-source-explorer clone lodash --clone-dir ./sources

# Analyze Webpack excluding optional dependencies
npx @keshavsoft/npm-source-explorer analyze webpack --no-optional
```

---

## JSON Output Structure

### `analyze` Report
The `analyze` command produces a machine-readable JSON structure detailing:
- `target`: The requested package specifier and resolved name/version.
- `summary`: Aggregate counts of nodes, dependency edges, and unresolved packages.
- `nodes`: Dictionary of all resolved packages, including location, version, integrity, and normalized repository information.
- `edges`: Directed relationships mapping parent packages to their dependency requirements.
- `generatedAt`: ISO 8601 generation timestamp.

### `verify` Report
Extends the `analyze` output with:
- `repositoryChecks`: Per-package status including HTTP accessibility, canonical repository URL, and Git tag match status (`found`, `not-found`, or `check-failed`).
- `verificationSummary`: Aggregate counts of accessible repositories and tag conventions.

> **Note on Version Tags:** Missing exact version tags in a remote repository serve as an **investigative signal**, not definitive proof of an issue. Upstream repositories adopt varying tag schemes (e.g. monorepo prefixes, release branches, or commit hashes).

### `clone` Report
Details the clone outcome for every unique repository discovered:
- Repository URL and destination directory path.
- Status code: `cloned`, `skipped-existing`, or `clone-failed`.

---

## Programmatic Library API (ESM)

You can also integrate `npm-source-explorer` directly into your Node.js tools and CI pipelines:

```javascript
// Import from V1 or V2 subpaths, or the root barrel export
import { analyzeDependencies } from "@keshavsoft/npm-source-explorer/v1";
import { verifyRepositories, cloneRepositories } from "@keshavsoft/npm-source-explorer/v2";

// 1. Resolve dependency tree
const report = await analyzeDependencies("json-renderers", {
  includeOptional: true
});

// 2. Perform repository and tag checks
const verification = await verifyRepositories(report);
console.log(`Verified ${verification.verificationSummary.totalPackages} packages.`);

// 3. Clone source repositories
const cloned = await cloneRepositories(report, "./cloned-sources");
console.log(`Successfully cloned ${cloned.filter(c => c.status === "cloned").length} repositories.`);
```

---

## Architecture & Source Layout

```
npm-source-explorer/
├── cli/
│   └── index.js             # CLI commands: analyze, verify, and clone
├── docs/
│   ├── .nojekyll            # Prevents Jekyll build override on GitHub Pages
│   └── index.html           # Interactive documentation & story website
├── src/
│   ├── index.js             # Public API exports
│   ├── v1/
│   │   └── index.js         # Isolated Arborist install & dependency resolution
│   └── v2/
│       └── index.js         # Git repository checks, tag matching & cloning
├── test/
│   └── helpers.test.js      # Unit tests for URL and metadata normalization
├── package.json             # Package configuration, bin mapping, exports
├── README.md                # Project documentation
└── STRUCTURE.md             # Codebase architecture details
```

For more in-depth structural details, see [`STRUCTURE.md`](https://github.com/keshavsoft/npm-source-explorer/blob/main/STRUCTURE.md).

---

## Limitations

- **Environment-Specific Resolutions**: The resolved dependency tree reflects the current platform and Node.js environment; optional or platform-specific dependencies (such as native binaries) may resolve differently on other operating systems.
- **Metadata Reliability**: Repository metadata originates from each package's published `package.json` manifest. It can occasionally be omitted, malformed, or point to archived repositories.
- **Tag Conventions**: Tag validation looks for standard conventions (`vX.Y.Z` and `X.Y.Z`). Monorepos that prefix tags with package names (e.g. `@scope/pkg@1.0.0`) may report as unverified.
- **Network Boundaries**: Remote repository checks and Git operations are subject to rate limiting, network firewalls, and private repository authentication.
- **Provenance Verification**: This utility inspects source repositories and tag references; it does not perform binary or cryptographic byte-level provenance checks between npm tarballs and Git commits.

---

## Development & Testing

```bash
# Clone the repository
git clone https://github.com/keshavsoft/npm-source-explorer.git
cd npm-source-explorer

# Install dependencies
npm install

# Run unit tests
npm test

# Run syntax and file checks
npm run check
```

---

## Links & Resources

- 🌐 **Documentation Website**: [keshavsoft.github.io/npm-source-explorer](https://keshavsoft.github.io/npm-source-explorer/)
- 📦 **npm Package**: [npmjs.com/package/@keshavsoft/npm-source-explorer](https://www.npmjs.com/package/@keshavsoft/npm-source-explorer)
- 🐙 **GitHub Repository**: [github.com/keshavsoft/npm-source-explorer](https://github.com/keshavsoft/npm-source-explorer)
- 🐛 **Issue Tracker**: [github.com/keshavsoft/npm-source-explorer/issues](https://github.com/keshavsoft/npm-source-explorer/issues)
- 📖 **Architecture Guide**: [`STRUCTURE.md`](https://github.com/keshavsoft/npm-source-explorer/blob/main/STRUCTURE.md)

---

## License

This project is licensed under the [MIT License](https://github.com/keshavsoft/npm-source-explorer/blob/main/LICENSE).  
Copyright © 2026 [KeshavSoft](https://github.com/keshavsoft).
