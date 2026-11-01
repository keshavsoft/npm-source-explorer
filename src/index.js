/**
 * @keshavsoft/npm-source-explorer
 *
 * Root export pointing to V5 Engine:
 * The story of discovering, mapping, and downloading upstream source repositories.
 */

export {
  SourceExplorer,
  explore,
  resolvePackageTree,
  normalizeRepoUrl,
  toCloneUrl,
  cloneRepo,
  toSafeFolderName,
  ExplorationStory
} from "./v6/index.js";
