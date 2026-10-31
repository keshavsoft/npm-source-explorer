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
 * Executes shallow git clone (--depth 1) with fail-safe timeout protection.
 * Prevents hanging on private prompts or frozen network sockets.
 */
export function cloneRepo(cloneUrl, targetDir, options = {}) {
  const timeoutMs = options.timeoutMs ?? 30000; // 30s fail-safe default

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let timedOut = false;

    // Fail-safe timeout timer
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill("SIGKILL");
      } catch {
        // Child already terminated
      }
      reject(new Error(`Git clone timed out after ${Math.round(timeoutMs / 1000)}s`));
    }, timeoutMs);

    const child = spawn("git", ["clone", "--depth", "1", cloneUrl, targetDir], {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0", // Never hang waiting for username/password prompt
        GIT_ASKPASS: "echo"       // Prevent pop-up credential helpers from freezing
      }
    });

    let stderr = "";
    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      if (!timedOut) reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (timedOut) return;

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

