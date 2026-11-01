/**
 * ============================================================================
 * npm-source-explorer :: V8 Engine
 * ----------------------------------------------------------------------------
 * The 4-Act Story:
 *   Act 1: The Gatekeeper   (1-gatekeeper)   - Validate package & check identity
 *   Act 2: The Cartographer (2-cartographer) - Build recursive dependency tree
 *   Act 3: The Detective     (3-detective)    - Map authentic Git repos & fallback
 *   Act 4: The Builder       (4-builder)      - Clone sibling repositories
 * ============================================================================
 */

import { validatePackage } from "./1-gatekeeper/index.js";
import { buildDependencyTree } from "./2-cartographer/index.js";
import { resolveRepositories } from "./3-detective/index.js";
import { cloneSiblings } from "./4-builder/index.js";

export async function explore(packageSpec, destinationDirectory = process.cwd(), options = {}) {
  const onProgress = typeof options.onProgress === "function" ? options.onProgress : () => {};

  // Act 1: The Gatekeeper - validate package identity
  const target = await validatePackage(packageSpec);
  onProgress({ chapter: 1, stage: "validated", target });

  // Act 2: The Cartographer - map recursive dependency tree in isolation
  onProgress({ chapter: 2, stage: "resolving", packageSpec: target.spec });
  const tree = await buildDependencyTree(target.spec);
  onProgress({ chapter: 2, stage: "tree-mapped", count: tree.length });

  // Act 3: The Detective - extract Git URLs, deduplicate & smart-fallback missing repos
  const repositories = resolveRepositories(tree, target.owner);
  onProgress({
    chapter: 3,
    stage: "resolved",
    totalPackages: tree.length,
    uniqueCount: repositories.length
  });

  // Act 4: The Builder - shallow clone all sibling repositories into workspace
  return await cloneSiblings(repositories, destinationDirectory, options);
}

export default explore;
