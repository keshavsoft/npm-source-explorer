# Source layout

- `src/V1/index.js`: isolated npm install via Arborist, graph traversal, repository metadata normalization.
- `src/V2/index.js`: repository page checks, common Git tag checks, optional Git cloning.
- `src/index.js`: public library exports.
- `cli/index.js`: npm CLI commands: `analyze`, `verify`, and `clone`.
- `test/helpers.test.js`: focused unit tests for URL normalization.
