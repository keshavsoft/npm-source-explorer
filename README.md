# @keshavsoft/npm-source-explorer

<p align="center">
  <strong>Download and shallow-clone all authentic upstream Git repositories behind any npm package as sibling folders in your workspace.</strong>
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
  <a href="https://github.com/keshavsoft/npm-source-explorer/blob/main/STRUCTURE.md">📖 <strong>Architecture & Decoupling</strong></a> •
  <a href="https://github.com/keshavsoft/npm-source-explorer/issues">🐛 <strong>Report Issue</strong></a> •
  <a href="#quick-start">🚀 <strong>Quick Start</strong></a>
</p>

---

## The Story: Why We Built This

### The `node_modules` Illusion

When inspecting, auditing, or learning from an open-source npm library, **opening `node_modules` is painful**:
- **Artifacts, Not Source:** Code inside `node_modules` is bundled, minified, transpiled, and stripped of inline documentation.
- **Missing Vital Context:** Test suites, benchmarks, documentation files, and original directory structures are excluded during package publish.
- **Zero Commit History:** You cannot run `git log`, `git blame`, or inspect pull requests to understand *why* an architectural choice was made.
- **The Browser Tab Nightmare:** To actually study the source of an ecosystem, developers manually search GitHub for 15+ individual repositories, locate their clone URLs, and run manual `git clone` commands one by one.

### The Vision: Authentic Source, Side-by-Side

**What developers truly want is the real source code.**

`npm-source-explorer` turns any package name into a complete, authentic, side-by-side Git workspace with a single command:

```bash
npx @keshavsoft/npm-source-explorer express
```

In seconds, your workspace transforms:

```
┌───────────────────────────────────┐       ┌───────────────────────────────────┐
│     The node_modules Illusion     │       │     Authentic Sibling Reality     │
│   (Minified, opaque, no tests)    │  ───► │  (Full Git histories, side-by-side)│
└───────────────────────────────────┘       └───────────────────────────────────┘
                                                           │
        my-workspace/                                      │
        ├── express/          ◄── Authentic upstream repo with tests & git history
        ├── accepts/          ◄── Sibling dependency repo
        ├── body-parser/      ◄── Sibling dependency repo
        ├── cookie/           ◄── Sibling dependency repo
        ├── finalhandler/     ◄── Sibling dependency repo
        ├── send/             ◄── Sibling dependency repo
        └── qs/               ◄── Sibling dependency repo
```

Open your folder in VS Code (`code .`), and you can instantly search across the unminified code, step through breakpoints, and explore the authentic craftsmanship of every package involved!

---

## Quick Start

No installation required. Run directly with `npx`:

```bash
# 1. Create and enter your audit workspace
mkdir audit-express && cd audit-express

# 2. Shallow-clone all upstream source repositories
npx @keshavsoft/npm-source-explorer express
```

You can also target a custom directory:

```bash
npx @keshavsoft/npm-source-explorer react ./react-ecosystem
```

---

## Live Terminal Output

Real-time progress shows the 4-act progression, package count, exact start timestamps, and elapsed clone durations:

```
$ npx @keshavsoft/npm-source-explorer json-renderers

🔍 Exploring dependencies for "json-renderers"...
📦 Found 26 packages (14 unique Git repositories).

  [1/14] json-renderers (started 21:10:01)... ✔ cloned in 1.8s
  [2/14] json-renderers-build (started 21:10:03)... ✔ cloned in 1.4s
  [3/14] json-to-spec (started 21:10:05)... ✔ cloned in 1.2s
  [4/14] json-transformer-funcs (started 21:10:07)... ✔ cloned in 1.5s (inferred from owner)
  ...

✨ Finished in 16.4s!
📁 Destination: ./
📊 Cloned: 14 | Skipped: 0 | Failed/Timed Out: 0
```

---

## How It Works: The 4-Act Story Engine

Under the hood, `npm-source-explorer` operates as a disciplined, 4-act narrative pipeline:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│     Act 1       │      │     Act 2       │      │     Act 3       │
│ The Gatekeeper  │ ───► │The Cartographer │ ───► │  The Detective  │
│(Validate Target)│      │(Map Tree via    │      │(Git Provenance &│
│                 │      │   Arborist)     │      │   Deduplicate)  │
└─────────────────┘      └─────────────────┘      └────────┬────────┘
                                                           │
                                                           ▼
                                            ┌─────────────────────────────┐
                                            │     SOURCE OF TRUTH         │
                                            │  (Canonical Git Manifest)   │
                                            └──────────────┬──────────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │     Act 4       │
                                                  │   The Builder   │
                                                  │(Shallow Sibling │
                                                  │    Cloning)     │
                                                  └─────────────────┘
```

1. **Act 1: The Gatekeeper (Powered by [`npm-repo-resolver`](https://github.com/keshavsoft/npm-repo-resolver))**  
   Validates the package specification, parses scopes (`@keshavsoft/pkg`), and establishes root package identity.
2. **Act 2: The Cartographer (Powered by [`npm-repo-resolver`](https://github.com/keshavsoft/npm-repo-resolver))**  
   Spins up an ephemeral, isolated workspace in `os.tmpdir()` and uses `@npmcli/arborist` to compute the transitive dependency tree without executing install scripts.
3. **Act 3: The Detective (Powered by [`npm-repo-resolver`](https://github.com/keshavsoft/npm-repo-resolver))**  
   Traces each dependency's authentic Git URL, canonicalizes formats (`git+https`, SCP, SSH) into HTTPS remotes, applies **Smart Owner Fallback** for monorepo packages, deduplicates, and outputs the **Source of Truth** manifest.
4. **Act 4: The Builder (Powered by [`git-sibling-cloner`](https://github.com/keshavsoft/git-sibling-cloner))**  
   Takes the Source of Truth manifest and executes `git clone --depth 1` side-by-side as siblings. Armed with a 25-second fail-safe timeout, credential prompt suppression (`GIT_TERMINAL_PROMPT=0`), and cross-platform process tree termination (`taskkill /pid /T /F` on Windows) so hung helper processes never freeze your terminal.

---

## Programmatic Library API (ESM)

Use the engine directly inside Node.js tools, audit scripts, or CI/CD pipelines:

```javascript
import { explore } from "@keshavsoft/npm-source-explorer";

const summary = await explore("express", "./sources", {
  timeoutMs: 25000,
  onProgress: (event) => {
    if (event.stage === "resolved") {
      console.log(`Discovered ${event.totalPackages} packages across ${event.uniqueCount} repositories.`);
    } else if (event.stage === "cloning-finish" && event.status === "cloned") {
      console.log(`Cloned [${event.index}/${event.total}] ${event.name} in ${(event.durationMs / 1000).toFixed(1)}s`);
    }
  }
});

console.log(`Successfully prepared ${summary.clonedCount} sibling repositories in ${summary.destination}!`);
```

---

## Architecture & The Decoupling Roadmap

The boundary between **Acts 1–3** (Tree Discovery & Git Provenance) and **Act 4** (Workspace Cloning) is mediated by a strict, immutable JSON data contract:

```json
[
  {
    "name": "express",
    "version": "4.18.2",
    "repoUrl": "https://github.com/expressjs/express",
    "cloneUrl": "https://github.com/expressjs/express.git",
    "folder": "express",
    "isInferred": false
  }
]
```

### The Decoupled Architecture (V9)

To honor the UNIX philosophy ("do one thing and do it well"), the core engine has been decoupled into two dedicated packages:

| Module / Package | Responsibility | Documentation | Package |
| :--- | :--- | :--- | :--- |
| **[`npm-repo-resolver`](https://github.com/keshavsoft/npm-repo-resolver)** | Discovers recursive npm trees & canonical Git remotes (The Source of Truth). | [Docs](https://keshavsoft.github.io/npm-repo-resolver/) | [npm](https://www.npmjs.com/package/npm-repo-resolver) |
| **[`git-sibling-cloner`](https://github.com/keshavsoft/git-sibling-cloner)** | Shallow-clones any list of Git repositories into sibling folders with fail-safes. | [Docs](https://keshavsoft.github.io/git-sibling-cloner/) | [npm](https://www.npmjs.com/package/git-sibling-cloner) |

This decoupling allows developers to:
1. **Audit & Dry-Run:** Generate a clean Git provenance manifest without downloading gigabytes of source code.
2. **Reuse the Cloner:** Use the sibling cloner with any repository manifest (GitHub organizations, internal repos, Cargo/Go modules).
3. **Compose with Pipes:**
   ```bash
   npx npm-repo-resolver express | npx git-sibling-cloner ./sources
   ```
4. **All-in-One CLI:** `@keshavsoft/npm-source-explorer` remains the flagship, unified experience orchestrating both modules.

See [`STRUCTURE.md`](./STRUCTURE.md) for the complete architectural breakdown and design contracts.

---

## Requirements

- **Node.js**: `>=20.0.0`
- **npm**: Installed and in `PATH`
- **Git**: Installed and in `PATH`

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

# Run syntax checks
npm run check
```

---

## Links & Ecosystem

- 🌐 **Documentation Website**: [keshavsoft.github.io/npm-source-explorer](https://keshavsoft.github.io/npm-source-explorer/)
- 📦 **npm Package**: [@keshavsoft/npm-source-explorer on npm](https://www.npmjs.com/package/@keshavsoft/npm-source-explorer)
- 🐙 **GitHub Repository**: [keshavsoft/npm-source-explorer on GitHub](https://github.com/keshavsoft/npm-source-explorer)
- 📖 **Architecture Guide**: [`STRUCTURE.md`](./STRUCTURE.md)
- 🐛 **Issue Tracker**: [GitHub Issues](https://github.com/keshavsoft/npm-source-explorer/issues)

---

## License

This project is licensed under the [MIT License](https://github.com/keshavsoft/npm-source-explorer/blob/main/LICENSE).  
Copyright © 2026 [KeshavSoft](https://github.com/keshavsoft).
