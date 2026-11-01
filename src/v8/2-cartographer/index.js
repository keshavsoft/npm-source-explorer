/**
 * Act 2: The Cartographer
 * ----------------------------------------------------------------------------
 * Recursively maps the complete dependency tree of the validated package
 * inside an isolated temporary sandbox.
 */

import Arborist from "@npmcli/arborist";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";

export async function buildDependencyTree(packageSpec) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "npm-source-explorer-v8-"));
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

    try {
      await arborist.reify({
        add: [packageSpec],
        audit: false,
        fund: false,
        progress: false,
        save: false
      });
    } catch (err) {
      throw new Error(`Package "${packageSpec}" could not be resolved on npm: ${err.message}`);
    }

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
      const repository = node.package?.repository ?? null;

      if (pkgName) {
        dependencies.push({
          name: pkgName,
          version: pkgVersion,
          repository
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

