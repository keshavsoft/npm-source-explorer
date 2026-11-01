/**
 * ============================================================================
 * npm-source-explorer :: V7 Engine
 * ----------------------------------------------------------------------------
 * The Story of Source Exploration:
 *
 * Every open-source npm package is built upon an interconnected network of
 * upstream libraries. npm-source-explorer unravels that dependency tree and
 * brings the authentic upstream Git source code directly into your workspace
 * as clean sibling folders.
 *
 * The Three Chapters:
 *   Chapter 1: Discovery  - Recursively map every dependency in the tree.
 *   Chapter 2: Provenance - Extract, deduplicate, and smart-infer Git repositories.
 *   Chapter 3: Workspace  - Download each source repository side-by-side.
 * ============================================================================
 */

import path from "node:path";
import fs from "node:fs/promises";
import { resolvePackageTree } from "./resolver.js";
import { normalizeRepoUrl, toCloneUrl, cloneRepo, extractGitHubOwner } from "./git.js";
import { toSafeFolderName } from "./naming.js";
import { ExplorationStory } from "./story.js";

export class SourceExplorer {
  /**
   * @param {object} options
   * @param {number} [options.timeoutMs=25000] - Fail-safe timeout per clone (default 25s)
   * @param {function} [options.onProgress] - Progress event subscriber
   */
  constructor(options = {}) {
    this.timeoutMs = options.timeoutMs ?? 25000;
    this.onProgress = options.onProgress ?? (() => {});
  }

  /**
   * Executes the complete 3-chapter source exploration story.
   *
   * @param {string} packageSpec - The npm package name, e.g. "json-renderers"
   * @param {string} [destinationDirectory] - Target workspace directory (default cwd)
   * @returns {Promise<object>} Complete exploration summary
   */
  async explore(packageSpec, destinationDirectory = process.cwd()) {
    const destination = path.resolve(destinationDirectory);
    await fs.mkdir(destination, { recursive: true });

    const story = new ExplorationStory(packageSpec, destination, this.onProgress);

    // Chapter 1: Discover recursive dependency tree
    story.startResolving();
    const dependencies = await this.discoverTree(packageSpec);

    // Chapter 2: Identify and deduplicate authentic Git repositories (with smart fallback)
    const repositories = this.identifyRepositories(dependencies);
    story.resolvedTree(dependencies, repositories);

    // Chapter 3: Download sibling repositories into workspace
    const results = await this.downloadSiblingRepositories(repositories, destination, story);

    return story.finish(results);
  }

  /**
   * Chapter 1: Recursively walks the package dependency tree in isolation.
   */
  async discoverTree(packageSpec) {
    return resolvePackageTree(packageSpec);
  }

  /**
   * Chapter 2: Extracts unique Git repositories.
   * Includes smart GitHub owner fallback for packages that omitted "repository" on npm.
   */
  identifyRepositories(dependencies) {
    // 1. Detect primary GitHub owner from declared repositories or scoped package
    let detectedOwner = null;
    for (const pkg of dependencies) {
      if (pkg.repoUrl) {
        detectedOwner = extractGitHubOwner(pkg.repoUrl);
        if (detectedOwner) break;
      }
    }

    const unique = new Map();

    for (const pkg of dependencies) {
      let repoUrl = pkg.repoUrl;
      let isInferred = false;

      // Smart fallback: if package omitted "repository" in package.json, infer from owner
      if (!repoUrl && detectedOwner) {
        const cleanName = toSafeFolderName(pkg.name);
        repoUrl = `https://github.com/${detectedOwner}/${cleanName}`;
        isInferred = true;
      }

      if (!repoUrl) continue;

      if (!unique.has(repoUrl)) {
        unique.set(repoUrl, {
          name: pkg.name,
          version: pkg.version,
          repoUrl,
          cloneUrl: toCloneUrl(repoUrl),
          folder: toSafeFolderName(pkg.name),
          isInferred
        });
      }
    }

    return Array.from(unique.values());
  }

  /**
   * Chapter 3: Clones every authentic upstream repository as a sibling folder.
   */
  async downloadSiblingRepositories(repositories, destination, story) {
    const results = [];
    let index = 0;

    for (const repo of repositories) {
      index++;
      const targetPath = path.join(destination, repo.folder);
      const itemStart = Date.now();

      story.startClone(index, repositories.length, repo);

      // Skip already-cloned sibling folders cleanly
      const exists = await fs.access(targetPath).then(() => true, () => false);
      if (exists) {
        const durationMs = Date.now() - itemStart;
        story.finishClone(index, repositories.length, repo, {
          status: "skipped",
          durationMs,
          detail: "already exists"
        });
        results.push({ ...repo, status: "skipped", durationMs });
        continue;
      }

      // Download upstream source code with fail-safe timeout protection
      try {
        const cloneResult = await cloneRepo(repo.cloneUrl, targetPath, {
          timeoutMs: this.timeoutMs
        });
        const durationMs = cloneResult.durationMs ?? (Date.now() - itemStart);
        story.finishClone(index, repositories.length, repo, {
          status: "cloned",
          durationMs,
          isInferred: repo.isInferred
        });
        results.push({ ...repo, status: "cloned", durationMs });
      } catch (error) {
        const durationMs = Date.now() - itemStart;
        const isNotFound = /not found|could not read/i.test(error.message);
        const isTimeout = error.message.includes("timed out");

        // If an inferred repo didn't exist on GitHub, skip gracefully without failing the run
        if (repo.isInferred && isNotFound) {
          story.finishClone(index, repositories.length, repo, {
            status: "skipped-unlinked",
            durationMs,
            detail: "not found on GitHub"
          });
          results.push({ ...repo, status: "skipped-unlinked", durationMs, detail: "not found on GitHub" });
          continue;
        }

        const status = isTimeout ? "timed-out" : "failed";
        story.finishClone(index, repositories.length, repo, {
          status,
          durationMs,
          error: error.message
        });
        results.push({ ...repo, status, durationMs, error: error.message });
      }
    }

    return results;
  }
}

/**
 * Convenience entry point to explore and clone an npm package.
 */
export async function explore(packageSpec, destinationDirectory, options) {
  const explorer = new SourceExplorer(options);
  return explorer.explore(packageSpec, destinationDirectory);
}

export default explore;
