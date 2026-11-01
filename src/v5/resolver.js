import Arborist from "@npmcli/arborist";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { normalizeRepoUrl } from "./git.js";

/**
 * Resolves the full recursive dependency tree of an npm package in an isolated
 * temporary environment and extracts authentic Git source repositories.
 *
 * @param {string} packageSpec - e.g. "json-renderers" or "express@4"
 * @returns {Promise<Array<{ name: string, version: string|null, repoUrl: string|null }>>}
 */
export async function resolvePackageTree(packageSpec) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "npm-source-explorer-v5-"));
  const workspacePath = path.join(tempDir, "workspace");

  try {
    await fs.mkdir(workspacePath, { recursive: true });

    const arborist = new Arborist({
      path: workspacePath,
      audit: false,
      fund: false,
      progress: false,
      loglevel: "silent"
    });

    await arborist.reify({
      add: [packageSpec],
      audit: false,
      fund: false,
      progress: false,
      save: false
    });

    const tree = await arborist.loadActual();
    const dependencies = [];
    const visited = new Set();

    function traverse(node) {
      if (!node) return;
      const key = node.location || `${node.name}@${node.version}`;
      if (visited.has(key)) return;
      visited.add(key);

      const pkgName = node.package?.name ?? node.name;
      const pkgVersion = node.package?.version ?? null;
      const repoUrl = normalizeRepoUrl(node.package?.repository);

      if (pkgName) {
        dependencies.push({
          name: pkgName,
          version: pkgVersion,
          repoUrl
        });
      }

      for (const edge of node.edgesOut.values()) {
        if (edge.to) traverse(edge.to);
      }
    }

    for (const child of tree.children.values()) {
      traverse(child);
    }

    return dependencies;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

