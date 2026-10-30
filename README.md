# @keshavsoft/npm-source-explorer

[![npm](https://img.shields.io/npm/v/@keshavsoft/npm-source-explorer)](https://www.npmjs.com/package/@keshavsoft/npm-source-explorer)
[![license](https://img.shields.io/npm/l/@keshavsoft/npm-source-explorer)](https://github.com/keshavsoft/npm-source-explorer/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/@keshavsoft/npm-source-explorer)](https://nodejs.org)

Inspect an npm package's resolved dependency graph and investigate the source repositories recorded in package metadata.

- **V1** — installs the target into a temporary directory and exports the full resolved dependency graph as JSON
- **V2** — builds on V1, adding repository URL checks, Git tag verification, and optional source cloning

> Network checks depend on npm, Git, and the target hosting service being reachable.

---

## Requirements

- Node.js 20+
- npm
- Git _(required for `verify` and `clone` commands)_

---

## Quick start

No install needed — just use `npx`:

```bash
npx @keshavsoft/npm-source-explorer analyze <package>
npx @keshavsoft/npm-source-explorer verify  <package>
npx @keshavsoft/npm-source-explorer clone   <package>
```

---

## CLI

```
npm-source-explorer analyze <package-spec> [--out <file>] [--no-optional]
npm-source-explorer verify  <package-spec> [--out <file>] [--no-optional]
npm-source-explorer clone   <package-spec> [--clone-dir <dir>] [--no-optional]
```

### Commands

| Command   | Description |
|-----------|-------------|
| `analyze` | Resolve and export the full dependency graph as JSON |
| `verify`  | Check repository URLs and Git version tags for each dependency |
| `clone`   | Clone every distinct source repository in the dependency tree |

### Options

| Option              | Default                              | Description |
|---------------------|--------------------------------------|-------------|
| `--out <file>`      | stdout                               | Write JSON output to a file |
| `--clone-dir <dir>` | `./npm-source-explorer-sources`      | Destination for cloned repositories |
| `--no-optional`     | —                                    | Exclude optional dependencies |
| `--help, -h`        | —                                    | Show help |
| `--version, -v`     | —                                    | Show version |

### Examples

```bash
# Analyze a package and save the dependency graph
npx @keshavsoft/npm-source-explorer analyze json-renderers --out ./reports/deps.json

# Verify repository URLs and Git tags
npx @keshavsoft/npm-source-explorer verify react --out ./reports/react-verify.json

# Clone all source repositories referenced in the tree
npx @keshavsoft/npm-source-explorer clone lodash --clone-dir ./sources

# Exclude optional dependencies
npx @keshavsoft/npm-source-explorer analyze webpack --no-optional
```

---

## JSON output

The `analyze` report contains:

| Field         | Description |
|---------------|-------------|
| `target`      | Requested package spec and resolved identity |
| `summary`     | Counts of package instances, edges, and unresolved edges |
| `nodes`       | Each resolved package — name, version, location, repository metadata |
| `edges`       | Dependency relationships with type and validity |
| `generatedAt` | ISO timestamp |

The `verify` report extends `analyze` with:

- `repositoryChecks` — per-package HTTP reachability and Git tag match results
- `verificationSummary` — aggregate counts

> A missing exact version tag is a **signal to inspect**, not proof of a problem. Repositories use many tag conventions.

The `clone` report lists each repository URL, its destination path, and clone status (`cloned`, `skipped-existing`, `clone-failed`).

---

## Library API

```js
import { analyzeDependencies } from "@keshavsoft/npm-source-explorer/v1";
import { verifyRepositories, cloneRepositories } from "@keshavsoft/npm-source-explorer/v2";

const report       = await analyzeDependencies("json-renderers");
const verification = await verifyRepositories(report);
const cloned       = await cloneRepositories(report, "./cloned-sources");
```

---

## Limitations

- The resolved graph reflects the current npm/platform environment; optional or platform-specific dependencies may differ on other systems.
- Repository metadata comes from each package's `package.json` and can be absent, malformed, or point to an unexpected repository.
- Tag matching checks `v<version>` and `<version>` conventions only — not a cryptographic provenance check.
- URL checks are best-effort and may be affected by rate limits, private repos, proxies, or firewalls.
- The tool does not verify that the Git source and the npm tarball are byte-for-byte identical.

---

## Development

```bash
git clone https://github.com/keshavsoft/npm-source-explorer.git
cd npm-source-explorer
npm install
npm test
npm run check
```

To test the CLI locally before publishing:

```bash
node ./cli/index.js analyze json-renderers --out ./dependencies.json
```

---

## Links

- **npm** — https://www.npmjs.com/package/@keshavsoft/npm-source-explorer
- **GitHub** — https://github.com/keshavsoft/npm-source-explorer

---

## License

[MIT](https://github.com/keshavsoft/npm-source-explorer/blob/main/LICENSE)
