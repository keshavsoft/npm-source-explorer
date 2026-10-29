import Arborist from "@npmcli/arborist";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";

function packageIdentity(node) {
  return {
    name: node.package?.name ?? node.name ?? "(unknown)",
    version: node.package?.version ?? null
  };
}

function repositoryValue(repository) {
  if (!repository) return null;
  if (typeof repository === "string") return repository;
  if (typeof repository === "object" && typeof repository.url === "string") {
    return repository.url;
  }
  return null;
}

export function normalizeRepositoryUrl(repository) {
  const raw = repositoryValue(repository);
  if (!raw) return null;

  let value = raw.trim().replace(/^git\+/, "");
  if (value.startsWith("git://")) value = `https://${value.slice(6)}`;
  if (value.startsWith("ssh://git@github.com/")) {
    value = `https://github.com/${value.slice("ssh://git@github.com/".length)}`;
  }
  if (value.startsWith("git@github.com:")) {
    value = `https://github.com/${value.slice("git@github.com:".length)}`;
  }

  value = value.replace(/\.git\/?$/, "").replace(/\/+$/, "");
  return value || null;
}

export function getRepositoryInfo(repository) {
  const raw = repositoryValue(repository);
  return {
    raw: raw ?? null,
    normalizedUrl: normalizeRepositoryUrl(repository)
  };
}

function nodeKey(node) {
  return node.location || `${node.package?.name ?? node.name}@${node.package?.version ?? "unknown"}`;
}

function shouldSkipEdge(edge, includeOptional) {
  return !includeOptional && edge.type === "optional";
}

/**
 * Install the target in an isolated temporary directory and report the
 * resolved dependency tree. The temporary installation is removed afterwards.
 */
export async function analyzeDependencies(packageSpec, options = {}) {
  if (typeof packageSpec !== "string" || !packageSpec.trim()) {
    throw new TypeError("packageSpec must be a non-empty npm package spec string.");
  }

  const includeOptional = options.includeOptional !== false;
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "npm-source-explorer-"));
  const installPath = path.join(tempRoot, "project");

  try {
    await fs.mkdir(installPath, { recursive: true });
    const arborist = new Arborist({
      path: installPath,
      audit: false,
      fund: false,
      progress: false,
      loglevel: options.loglevel ?? "silent"
    });

    await arborist.reify({
      add: [packageSpec],
      audit: false,
      fund: false,
      progress: false,
      packageLock: true,
      save: true
    });

    const tree = await arborist.loadActual();
    const directNodes = [...tree.children.values()];
    const targetName = packageSpec.startsWith("@")
      ? packageSpec.split("@").slice(0, 2).join("@")
      : packageSpec.split("@")[0];

    const targetNode =
      directNodes.find((node) => node.package?.name === targetName) ??
      (directNodes.length === 1 ? directNodes[0] : null);

    if (!targetNode) {
      throw new Error(`Could not locate the installed target package for "${packageSpec}".`);
    }

    const nodesByKey = new Map();
    const edges = [];
    const visited = new Set();

    function visit(node) {
      const key = nodeKey(node);
      if (!nodesByKey.has(key)) {
        const identity = packageIdentity(node);
        const repo = getRepositoryInfo(node.package?.repository);
        nodesByKey.set(key, {
          id: key,
          ...identity,
          location: node.location || "",
          resolved: node.package?._resolved ?? null,
          integrity: node.package?._integrity ?? null,
          repository: repo
        });
      }

      if (visited.has(key)) return;
      visited.add(key);

      for (const edge of node.edgesOut.values()) {
        if (shouldSkipEdge(edge, includeOptional)) continue;
        if (!edge.to) {
          edges.push({
            from: key,
            name: edge.name,
            spec: edge.spec,
            type: edge.type,
            to: null,
            valid: false,
            error: edge.error ?? "UNRESOLVED"
          });
          continue;
        }

        const toKey = nodeKey(edge.to);
        visit(edge.to);
        edges.push({
          from: key,
          name: edge.name,
          spec: edge.spec,
          type: edge.type,
          to: toKey,
          valid: edge.valid,
          error: edge.error ?? null
        });
      }
    }

    visit(targetNode);

    const root = nodesByKey.get(nodeKey(targetNode));
    return {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      target: {
        requested: packageSpec,
        name: root.name,
        version: root.version
      },
      options: { includeOptional },
      summary: {
        packageInstances: nodesByKey.size,
        dependencyEdges: edges.length,
        unresolvedEdges: edges.filter((edge) => edge.to === null).length
      },
      nodes: [...nodesByKey.values()].sort((a, b) =>
        `${a.name}@${a.version}:${a.location}`.localeCompare(`${b.name}@${b.version}:${b.location}`)
      ),
      edges: edges.sort((a, b) =>
        `${a.from}:${a.name}:${a.to ?? ""}`.localeCompare(`${b.from}:${b.name}:${b.to ?? ""}`)
      )
    };
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
}

// Allows running this module directly for a quick local smoke test.
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const spec = process.argv[2];
  if (!spec) {
    console.error("Usage: node src/V1/index.js <package-spec>");
    process.exitCode = 1;
  } else {
    analyzeDependencies(spec)
      .then((report) => console.log(JSON.stringify(report, null, 2)))
      .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
      });
  }
}
