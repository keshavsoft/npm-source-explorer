# @keshavsoft/npm-source-explorer

<p align="center">
  <strong>Download and clone all upstream Git repositories behind any npm package as sibling folders in your workspace.</strong>
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

## The Story: Why We Built This

When inspecting or auditing an npm package, **reading `node_modules` is painful**:
- Code inside `node_modules` is minified, bundled, stripped of comments, missing unit tests, and lacks Git history.
- Reading a 5,000-line JSON dependency tree doesn't help you actually understand the code.

**What developers really want is the real source code.**

`npm-source-explorer` solves this with a single command:
1. It recursively resolves the target npm package and all of its dependencies.
2. It discovers the authentic upstream Git/GitHub repository for each package.
3. It shallow-clones (`--depth 1`) every distinct repository **side-by-side as sibling folders** right where you ran the command.

Open your folder in VS Code or your IDE, and you can instantly explore, search, and step through the authentic source code of every package involved!

```
my-audit-folder/
├── express/               <-- Authentic source code, commit history & tests
├── accepts/               <-- Sibling dependency repo
├── body-parser/           <-- Sibling dependency repo
├── cookie/                <-- Sibling dependency repo
└── qs/                    <-- Sibling dependency repo
```

---

## Quick Start

Create an empty folder and run one simple command with `npx`:

```bash
# Go to your audit or exploration directory
mkdir audit-express && cd audit-express

# Clone all upstream repositories as siblings
npx @keshavsoft/npm-source-explorer express
```

You can also specify a custom destination folder:

```bash
npx @keshavsoft/npm-source-explorer react ./react-sources
```

---

## Requirements

- **Node.js**: `>=20.0.0`
- **npm**: Installed and available in PATH
- **Git**: Installed and available in PATH

---

## Global Installation (Optional)

If you prefer installing it globally:

```bash
npm install -g @keshavsoft/npm-source-explorer

# Now run it directly anywhere
npm-source-explorer express
```

---

## Programmatic Library API (ESM)

You can also use the V3 engine directly in your Node.js scripts or CI pipelines:

```javascript
import { exploreAndClone } from "@keshavsoft/npm-source-explorer";

const summary = await exploreAndClone("express", "./sources", {
  onProgress: (event) => {
    if (event.stage === "cloning") {
      console.log(`Cloning [${event.index}/${event.total}] ${event.name}`);
    }
  }
});

console.log(`Successfully cloned ${summary.clonedCount} repositories!`);
```

---

## Architecture (V3 Engine)

The V3 engine is lean, simple, and self-contained with **zero legacy dependencies**:

```
npm-source-explorer/
├── cli/
│   └── index.js             # Simple, intuitive CLI runner
├── docs/
│   ├── .nojekyll            # Prevents Jekyll build override on GitHub Pages
│   └── index.html           # Interactive storytelling documentation website
├── src/
│   ├── index.js             # Root export (routes to V3)
│   └── v3/                  # ★ Lean, Single-Purpose V3 Engine
│       ├── git.js           # Clean URL normalization & shallow git clone
│       ├── resolver.js      # Isolated dependency resolution & repo URL discovery
│       └── index.js         # exploreAndClone workflow orchestrator
├── test/
│   └── helpers.test.js      # Unit tests for URL normalizers
├── package.json             # Package configuration & metadata
├── README.md                # Project documentation
└── STRUCTURE.md             # Architecture overview
```

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
