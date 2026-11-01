/**
 * Act 4: The Builder
 * ----------------------------------------------------------------------------
 * Prepares the workspace and shallow-clones authentic Git repositories
 * side-by-side as siblings with fail-safe timeouts and Windows tree-killing.
 */

import path from "node:path";
import fs from "node:fs/promises";
import { spawn, exec } from "node:child_process";

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

export async function cloneSiblings(repositories, destinationDirectory = process.cwd(), options = {}) {
  const destination = path.resolve(destinationDirectory);
  await fs.mkdir(destination, { recursive: true });

  const onProgress = typeof options.onProgress === "function" ? options.onProgress : () => {};
  const timeoutMs = options.timeoutMs ?? 25000;
  const startTime = Date.now();

  const results = [];
  let index = 0;

  for (const repo of repositories) {
    index++;
    const targetPath = path.join(destination, repo.folder);
    const itemStart = Date.now();

    onProgress({
      chapter: 4,
      stage: "cloning-start",
      index,
      total: repositories.length,
      name: repo.name,
      folder: repo.folder,
      repoUrl: repo.repoUrl,
      startedAt: new Date().toLocaleTimeString()
    });

    // 1. Skip if already exists on disk
    const exists = await fs.access(targetPath).then(() => true, () => false);
    if (exists) {
      const durationMs = Date.now() - itemStart;
      const record = {
        index,
        total: repositories.length,
        name: repo.name,
        folder: repo.folder,
        repoUrl: repo.repoUrl,
        status: "skipped",
        durationMs,
        detail: "already exists"
      };
      results.push(record);
      onProgress({ chapter: 4, stage: "cloning-finish", ...record });
      continue;
    }

    // 2. Clone repository
    try {
      const cloneResult = await cloneRepo(repo.cloneUrl, targetPath, { timeoutMs });
      const durationMs = cloneResult.durationMs ?? (Date.now() - itemStart);
      const record = {
        index,
        total: repositories.length,
        name: repo.name,
        folder: repo.folder,
        repoUrl: repo.repoUrl,
        status: "cloned",
        durationMs,
        isInferred: Boolean(repo.isInferred)
      };
      results.push(record);
      onProgress({ chapter: 4, stage: "cloning-finish", ...record });
    } catch (error) {
      const durationMs = Date.now() - itemStart;
      const isNotFound = /not found|could not read/i.test(error.message);
      const isTimeout = error.message.includes("timed out");

      let status = isTimeout ? "timed-out" : "failed";
      let detail = error.message;

      // Inferred repo that does not exist on GitHub skips cleanly
      if (repo.isInferred && isNotFound) {
        status = "skipped-unlinked";
        detail = "not found on GitHub";
      }

      const record = {
        index,
        total: repositories.length,
        name: repo.name,
        folder: repo.folder,
        repoUrl: repo.repoUrl,
        status,
        durationMs,
        detail,
        error: error.message
      };
      results.push(record);
      onProgress({ chapter: 4, stage: "cloning-finish", ...record });
    }
  }

  const totalDurationMs = Date.now() - startTime;
  const clonedCount = results.filter((r) => r.status === "cloned").length;
  const skippedCount = results.filter((r) => r.status === "skipped" || r.status === "skipped-unlinked").length;
  const failedCount = results.filter((r) => r.status === "failed" || r.status === "timed-out").length;

  const summary = {
    destination,
    totalPackages: repositories.length,
    uniqueRepositories: repositories.length,
    clonedCount,
    skippedCount,
    failedCount,
    totalDurationMs,
    results
  };

  onProgress({ stage: "completed", summary });
  return summary;
}

