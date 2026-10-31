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
 * Main V3 workflow:
 * Takes any npm package, finds all its dependencies recursively,
 * and shallow-clones their source repositories side-by-side as siblings.
 */
export async function exploreAndClone(packageSpec, destinationDirectory = process.cwd(), options = {}) {
  const onProgress = options.onProgress || (() => {});
  const destination = path.resolve(destinationDirectory);
  await fs.mkdir(destination, { recursive: true });

  onProgress({ stage: "resolving", packageSpec });
  const packages = await resolvePackageRepositories(packageSpec);

  // Deduplicate by repository URL
  const uniqueRepos = new Map();
  for (const pkg of packages) {
    if (pkg.repoUrl && !uniqueRepos.has(pkg.repoUrl)) {
      uniqueRepos.set(pkg.repoUrl, pkg);
    }
  }

  onProgress({
    stage: "resolved",
    totalPackages: packages.length,
    uniqueCount: uniqueRepos.size
  });

  const results = [];
  let index = 0;

  for (const [repoUrl, pkg] of uniqueRepos) {
    index++;
    const folderName = getSafeFolderName(pkg.name);
    const targetPath = path.join(destination, folderName);
    const cloneUrl = toCloneUrl(repoUrl);

    try {
      await fs.access(targetPath);
      results.push({ name: pkg.name, repoUrl, folder: folderName, status: "skipped" });
      onProgress({
        stage: "cloning",
        index,
        total: uniqueRepos.size,
        name: pkg.name,
        status: "skipped",
        detail: "folder already exists"
      });
      continue;
    } catch {
      // Folder does not exist, proceed to clone
    }

    try {
      await cloneRepo(cloneUrl, targetPath);
      results.push({ name: pkg.name, repoUrl, folder: folderName, status: "cloned" });
      onProgress({
        stage: "cloning",
        index,
        total: uniqueRepos.size,
        name: pkg.name,
        status: "cloned"
      });
    } catch (error) {
      results.push({
        name: pkg.name,
        repoUrl,
        folder: folderName,
        status: "failed",
        error: error.message
      });
      onProgress({
        stage: "cloning",
        index,
        total: uniqueRepos.size,
        name: pkg.name,
        status: "failed",
        detail: error.message
      });
    }
  }

  return {
    destination,
    totalPackages: packages.length,
    uniqueRepositories: uniqueRepos.size,
    clonedCount: results.filter((r) => r.status === "cloned").length,
    skippedCount: results.filter((r) => r.status === "skipped").length,
    failedCount: results.filter((r) => r.status === "failed").length,
    results
  };
}

// Backwards-compatible aliases for library users
export { resolvePackageRepositories, normalizeRepoUrl, toCloneUrl, cloneRepo };
export const analyzeDependencies = async (spec) => ({ nodes: await resolvePackageRepositories(spec) });
export const cloneRepositories = (report, dest) => exploreAndClone(report.target?.requested || report, dest);
