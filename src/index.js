/**
 * @keshavsoft/npm-source-explorer
 *
 * Single command to clone all recursive dependency repositories
 * as siblings in your current workspace.
 */

export {
  exploreAndClone,
  resolvePackageRepositories,
  normalizeRepoUrl,
  toCloneUrl,
  cloneRepo,
  analyzeDependencies,
  cloneRepositories
} from "./v3/index.js";
