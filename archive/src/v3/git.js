import { spawn } from "node:child_process";

/**
 * Normalizes varying repository URLs/objects into clean HTTPS URLs.
 */
export function normalizeRepoUrl(repository) {
  if (!repository) return null;
  let raw = typeof repository === "string" ? repository.trim() : repository.url?.trim();
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

/**
 * Converts an HTTPS repo URL to a valid clone remote.
 */
export function toCloneUrl(url) {
  if (!url) return null;
  if (/^https:\/\/(github\.com|gitlab\.com|bitbucket\.org)\//i.test(url)) {
    return `${url}.git`;
  }
  return url;
}

/**
 * Executes shallow git clone (--depth 1).
 */
export function cloneRepo(cloneUrl, targetDir) {
  return new Promise((resolve, reject) => {
    const child = spawn("git", ["clone", "--depth", "1", cloneUrl, targetDir], {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true
    });

    let stderr = "";
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.trim() || `git exited with code ${code}`));
    });
  });
}

