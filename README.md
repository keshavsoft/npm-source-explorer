# @keshavsoft/npm-source-explorer

Inspect an npm package's resolved dependency graph and investigate the source repositories recorded in package metadata.

> **Current scope:** V1 installs the requested package into a temporary directory and exports the resolved dependency graph. V2 adds repository URL checks, Git tag checks, and optional repository cloning. Network checks depend on npm, Git, and the target hosting service being reachable.

## Requirements

- Node.js 20 or newer
- npm
- Git (needed for repository verification and cloning)

## Install for development

```bash
npm install
npm test
npm run check
```

## CLI examples

Analyze a package and write JSON:

```bash
npx . analyze json-renderers --out ./reports/json-renderers.json
```

Inspect npm repository metadata and check repository pages/tags:

```bash
npx . verify json-renderers --out ./reports/json-renderers-verify.json
```

Clone repositories referenced by the resolved dependency tree:

```bash
npx . clone json-renderers --clone-dir ./cloned-sources
```

After publishing, use:

```bash
npx @keshavsoft/npm-source-explorer analyze json-renderers --out dependencies.json
npx @keshavsoft/npm-source-explorer verify json-renderers
npx @keshavsoft/npm-source-explorer clone json-renderers --clone-dir ./sources
```

The `analyze` command accepts a package name or npm package spec, for example `json-renderers`, `json-renderers@1.21.7`, or `@scope/package@1.2.3`.

## Output

The JSON report contains:

- `target`: requested package spec and resolved root package identity
- `summary`: number of package instances and dependency edges
- `nodes`: resolved package instances, versions, install locations, and repository metadata
- `edges`: dependency relationships with dependency type and validity information
- `generatedAt`: report timestamp

`verify` adds a `repositoryChecks` array. A check can report that the repository URL is missing, the web page could not be reached, Git metadata could not be queried, or a version-like tag was found/not found. A missing exact tag is a **signal to inspect**, not proof that the npm release is invalid: repositories use many tag conventions and some publish from a commit without a matching tag.

`clone` clones each distinct repository URL it can identify into the destination directory. Cloning is optional and can download a large amount of source. It does not execute package scripts itself, but installing the dependency tree for analysis may run lifecycle scripts according to npm's normal behavior. Review packages before analyzing untrusted targets.

## CLI options

- `--out <file>`: write the JSON report to a file; without it, JSON is printed to stdout.
- `--clone-dir <dir>`: destination for cloned repositories.
- `--no-optional`: omit optional dependencies from the graph.
- `--help`: show help.

## Library API

```js
import {
  analyzeDependencies,
  verifyRepositories,
  cloneRepositories
} from "@keshavsoft/npm-source-explorer";

const report = await analyzeDependencies("json-renderers");
const verification = await verifyRepositories(report);
const cloned = await cloneRepositories(report, "./cloned-sources");
```

The V1 API is available from `@keshavsoft/npm-source-explorer/V1`; the V2 API is available from `@keshavsoft/npm-source-explorer/V2`.

## Important limitations

- The graph is the resolved installation tree for the current npm/platform environment. Optional or platform-specific dependencies can differ across systems.
- Repository metadata comes from each installed package's `package.json`; it can be absent, malformed, or point to a different repository than expected.
- Tag matching checks common `v<version>` and `<version>` tag names. It is not a cryptographic provenance or supply-chain attestation check.
- URL checks are best-effort and may be affected by rate limits, private repositories, proxies, firewalls, or authentication.
- The tool does not claim that Git source and npm tarball contents are byte-for-byte identical. That would require a separate reproducible-build/provenance comparison.

## Publish

Before publishing, verify that the scoped package name is available and that your npm account has permission to publish under `@keshavsoft`.

```bash
npm login
npm test
npm run check
npm pack --dry-run
npm publish --access public
```

If you want to test the CLI before publishing, run `node ./cli/index.js analyze json-renderers --out ./dependencies.json`.

## License

MIT
