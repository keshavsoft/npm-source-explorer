/**
 * Act 3: The Detective
 * ----------------------------------------------------------------------------
 * Investigates each dependency in the tree: extracts declared Git URLs,
 * applies smart owner fallback for missing repository links, and deduplicates.
 */

export function normalizeRepoUrl(repository) {
  if (!repository) return null;
  const raw = typeof repository === "string" ? repository.trim() : repository.url?.trim();
  if (!raw) return null;

  let url = raw.replace(/^git\+/, "");
  if (url.startsWith("git://")) {
    url = `https://${url.slice(6)}`;
  } else if (url.startsWith("ssh://git@github.com/")) {
    url = `https://github.com/${url.slice("ssh://git@github.com/".length)}`;
  } else if (url.startsWith("git@github.com:")) {
    url = `https://github.com/${url.slice("git@github.com:".length)}`;
  }

  url = url.replace(/\.git\/?$/, "").replace(/\/+$/, "");
  return url || null;
}

export function toCloneUrl(url) {
  if (!url) return null;
  if (/^https:\/\/(github\.com|gitlab\.com|bitbucket\.org)\//i.test(url)) {
    return `${url}.git`;
  }
  return url;
}

export function extractGitHubOwner(url) {
  if (!url || typeof url !== "string") return null;
  const match = url.match(/^https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)(?:\/|$)/i);
  return match ? match[1] : null;
}

export function toSafeFolderName(packageName) {
  if (!packageName || typeof packageName !== "string") {
    return "unnamed-package";
  }

  return packageName
    .replace(/^@/, "")
    .replace(/[\\/]/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "-");
}

export function resolveRepositories(dependencies, defaultOwner = null) {
  // 1. Detect primary GitHub owner from declared repositories if not already provided
  let detectedOwner = defaultOwner;
  if (!detectedOwner) {
    for (const pkg of dependencies) {
      const url = normalizeRepoUrl(pkg.repository);
      if (url) {
        detectedOwner = extractGitHubOwner(url);
        if (detectedOwner) break;
      }
    }
  }

  const unique = new Map();

  // 2. Map and deduplicate all repositories
  for (const pkg of dependencies) {
    let repoUrl = normalizeRepoUrl(pkg.repository);
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

