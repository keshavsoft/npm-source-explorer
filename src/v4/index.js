import path from "node:path";
import fs from "node:fs/promises";
import { resolvePackageRepositories } from "./resolver.js";
import { normalizeRepoUrl, toCloneUrl, cloneRepo } from "./git.js";

function getSafeFolderName(pkgName) {
  return pkgName
    .replace(/^@/, "")
    .replace(/[\\/]/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "-");
}

/**
 * Main V4 Engine:
 * Takes an npm package, finds all upstream dependencies,
 * and shallow-clones them as sibling folders with fail-safe timeouts.
 */
export async function exploreAndClone(packageSpec, destinationDirectory = process.cwd(), options = {}) {
  const onProgress = options.onProgress || (() => {});
  const timeoutMs = options.timeoutMs ?? 30000; // 30s fail-safe per clone
  const destination = path.resolve(destinationDirectory);
  await fs.mkdir(destination, { recursive: true });

  const overallStart = Date.now();
  onProgress({ stage: "resolving", packageSpec, startedAt: new Date().toLocaleTimeString() });

  const packages = await resolvePackageRepositories(packageSpec, options);

  // De-duplicate repositories
  const uniqueRepos = new Map();
  for (const pkg of packages) {
    if (pkg.repoUrl && !uniqueRepos.has(pkg.repoUrl)) {
      uniqueRepos.set(pkg.repoUrl, pkg);
    }
  }

  onProgress({
    stage: "resolved",
    totalPackages: packages.length,
    uniqueCount: uniqueRepos.size,
    durationMs: Date.now() - overallStart
  });

  const results = [];
  let index = 0;

  for (const [repoUrl, pkg] of uniqueRepos) {
    index++;
    const folderName = getSafeFolderName(pkg.name);
    const targetPath = path.join(destination, folderName);
    const cloneUrl = toCloneUrl(repoUrl);
    const itemStart = Date.now();
    const startTimeStr = new Date().toLocaleTimeString();

    // Notify item start
    onProgress({
      stage: "cloning-start",
      index,
      total: uniqueRepos.size,
      name: pkg.name,
      startedAt: startTimeStr
    });

    try {
      await fs.access(targetPath);
      const durationMs = Date.now() - itemStart;
      results.push({ name: pkg.name, repoUrl, folder: folderName, status: "skipped", durationMs });
      onProgress({
        stage: "cloning-finish",
        index,
        total: uniqueRepos.size,
        name: pkg.name,
        status: "skipped",
        detail: "already exists",
        durationMs
      });
      continue;
    } catch {
      // Folder does not exist, proceed to clone
    }

    try {
      const cloneResult = await cloneRepo(cloneUrl, targetPath, { timeoutMs });
      const durationMs = cloneResult.durationMs ?? (Date.now() - itemStart);
      results.push({ name: pkg.name, repoUrl, folder: folderName, status: "cloned", durationMs });
      onProgress({
        stage: "cloning-finish",
        index,
        total: uniqueRepos.size,
        name: pkg.name,
        status: "cloned",
        durationMs
      });
    } catch (error) {
      const durationMs = Date.now() - itemStart;
      const isTimeout = error.message.includes("timed out");
      results.push({
        name: pkg.name,
        repoUrl,
        folder: folderName,
        status: isTimeout ? "timed-out" : "failed",
        error: error.message,
        durationMs
      });
      onProgress({
        stage: "cloning-finish",
        index,
        total: uniqueRepos.size,
        name: pkg.name,
        status: isTimeout ? "timed-out" : "failed",
        detail: error.message,
        durationMs
      });
    }
  }

  const totalDurationMs = Date.now() - overallStart;

  return {
    destination,
    totalPackages: packages.length,
    uniqueRepositories: uniqueRepos.size,
    clonedCount: results.filter((r) => r.status === "cloned").length,
    skippedCount: results.filter((r) => r.status === "skipped").length,
    failedCount: results.filter((r) => r.status === "failed" || r.status === "timed-out").length,
    totalDurationMs,
    results
  };
}

export { resolvePackageRepositories, normalizeRepoUrl, toCloneUrl, cloneRepo };
export const analyzeDependencies = async (spec) => ({ nodes: await resolvePackageRepositories(spec) });
export const cloneRepositories = (report, dest) => exploreAndClone(report.target?.requested || report, dest);

