/**
 * @keshavsoft/npm-source-explorer
 *
 * Root export pointing to V4 (featuring fail-safe timeouts and duration tracking).
 */

export {
  exploreAndClone,
  resolvePackageRepositories,
  normalizeRepoUrl,
  toCloneUrl,
  cloneRepo,
  analyzeDependencies,
  cloneRepositories
} from "./v4/index.js";
