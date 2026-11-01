/**
 * ============================================================================
 * npm-source-explorer :: V9 Engine
 * ----------------------------------------------------------------------------
 * Decoupled Micro-Ecosystem Orchestrator:
 *   Stage 1: The Resolver (npm-repo-resolver) - Discover dependency tree & build Source of Truth
 *   Stage 2: The Builder  (git-sibling-cloner) - Shallow-clone sibling repositories into workspace
 * ============================================================================
 */

import { resolveDependencyRepos } from "npm-repo-resolver";
import { cloneSiblings } from "git-sibling-cloner";

export async function explore(packageSpec, destinationDirectory = process.cwd(), options = {}) {
  const onProgress = typeof options.onProgress === "function" ? options.onProgress : () => {};

  // Stage 1: The Resolver (npm-repo-resolver)
  // Recursively discover dependencies and build canonical Source of Truth
  const repositories = await resolveDependencyRepos(packageSpec, {
    onProgress: (event) => {
      if (event.act === 1 && event.stage === "validated") {
        onProgress({ chapter: 1, stage: "validated", target: event.target });
      } else if (event.act === 2 && event.stage === "resolving") {
        onProgress({ chapter: 2, stage: "resolving", packageSpec: event.packageSpec });
      } else if (event.act === 2 && event.stage === "tree-mapped") {
        onProgress({ chapter: 2, stage: "tree-mapped", count: event.count });
      } else if (event.act === 3 && event.stage === "resolved") {
        onProgress({
          chapter: 3,
          stage: "resolved",
          totalPackages: event.totalPackages,
          uniqueCount: event.uniqueCount
        });
      }
    }
  });

  // Stage 2: The Builder (git-sibling-cloner)
  // Shallow-clone sibling repositories into target workspace
  return await cloneSiblings(repositories, destinationDirectory, {
    ...options,
    onProgress: (event) => {
      if (event.stage === "cloning-start" || event.stage === "cloning-finish") {
        onProgress({ chapter: 4, ...event });
      } else if (event.stage === "completed") {
        onProgress(event);
      }
    }
  });
}

export { resolveDependencyRepos, cloneSiblings };
export default explore;

