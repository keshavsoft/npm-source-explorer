import { spawn, exec } from "node:child_process";

/**
 * Normalizes diverse repository strings/objects into a canonical HTTPS URL.
 * Supports GitHub, GitLab, Bitbucket, git+https, ssh, and git:// formats.
 *
 * @param {string|object} repository - The repository field from package.json
 * @returns {string|null} - Normalized HTTPS URL or null
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

/**
 * Converts a canonical HTTPS repository URL to a clone remote.
 *
 * @param {string} url
 * @returns {string|null}
 */
export function toCloneUrl(url) {
  if (!url) return null;
  if (/^https:\/\/(github\.com|gitlab\.com|bitbucket\.org)\//i.test(url)) {
    return `${url}.git`;
  }
  return url;
}

/**
 * Extracts the GitHub owner (organization/user) from an HTTPS repository URL.
 * e.g. "https://github.com/keshavsoft/json-renderers" -> "keshavsoft"
 *
 * @param {string} url
 * @returns {string|null}
 */
export function extractGitHubOwner(url) {
  if (!url || typeof url !== "string") return null;
  const match = url.match(/^https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)(?:\/|$)/i);
  return match ? match[1] : null;
}

/**
 * Forcefully terminates a child process and all its descendants.
 * Solves the Windows issue where git.exe spawns git-remote-https.exe.
 */
function killProcessTree(child) {
  if (!child || !child.pid) return;

  if (process.platform === "win32") {
    exec(`taskkill /pid ${child.pid} /T /F`, () => {});
  } else {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      try {
        child.kill("SIGKILL");
      } catch {}
    }
  }
}

/**
 * Performs a shallow Git clone (--depth 1) with fail-safe timeout protection.
 *
 * @param {string} cloneUrl - Remote repository URL
 * @param {string} targetDir - Destination folder path
 * @param {object} options - Options including timeoutMs (default 25000)
 * @returns {Promise<{ durationMs: number }>}
 */
export function cloneRepo(cloneUrl, targetDir, options = {}) {
  const timeoutMs = options.timeoutMs ?? 25000;

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let isSettled = false;

    const child = spawn("git", ["clone", "--depth", "1", cloneUrl, targetDir], {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      detached: process.platform !== "win32",
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0",
        GIT_ASKPASS: "echo"
      }
    });

    const timer = setTimeout(() => {
      if (isSettled) return;
      isSettled = true;
      killProcessTree(child);
      reject(new Error(`Git clone timed out after ${Math.round(timeoutMs / 1000)}s`));
    }, timeoutMs);

    let stderr = "";
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code) => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timer);

      const durationMs = Date.now() - startTime;
      if (code === 0) {
        resolve({ durationMs });
      } else {
        const message = stderr.trim() || `git exited with code ${code}`;
        reject(new Error(message));
      }
    });
  });
}

