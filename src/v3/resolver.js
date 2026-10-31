import Arborist from "@npmcli/arborist";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { normalizeRepoUrl } from "./git.js";

/**
 * Resolves all recursive dependencies for a package in an isolated temporary directory
 * and extracts their Git repository URLs.
 */
export async function resolvePackageRepositories(packageSpec) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "npm-source-explorer-"));
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
    const packages = [];
    const visited = new Set();

    function collect(node) {
      if (!node) return;
      const key = node.location || `${node.name}@${node.version}`;
      if (visited.has(key)) return;
      visited.add(key);

      const pkgName = node.package?.name ?? node.name;
      const pkgVersion = node.package?.version ?? null;
      const repoUrl = normalizeRepoUrl(node.package?.repository);

      if (pkgName) {
        packages.push({
          name: pkgName,
          version: pkgVersion,
          repoUrl
        });
      }

      for (const edge of node.edgesOut.values()) {
        if (edge.to) collect(edge.to);
      }
    }

    // Traverse all children installed
    for (const child of tree.children.values()) {
      collect(child);
    }

    return packages;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

