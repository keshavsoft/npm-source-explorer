import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { promisify } from "node:util";
import { normalizeRepositoryUrl } from "../v1/index.js";

const spawnAsync = promisify(spawn);

function repositoryUrlFromNode(node) {
  return normalizeRepositoryUrl(node.repository?.raw ?? node.repository?.normalizedUrl);
}

function gitUrl(url) {
  if (!url) return null;
  if (/^https:\/\/github\.com\//i.test(url)) return `${url}.git`;
  if (/^https:\/\/gitlab\.com\//i.test(url)) return `${url}.git`;
  if (/^https:\/\/bitbucket\.org\//i.test(url)) return `${url}.git`;
  return url;
}

async function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      ...options
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr?.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else {
        const error = new Error(`${command} exited with code ${code}: ${stderr.trim()}`);
        error.code = code;
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      }
    });
  });
}

async function checkWebUrl(url, timeoutMs = 10000) {
  if (!url) return { status: "missing", reachable: false, detail: "No repository URL in package metadata." };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal });
    }
    return {
      status: response.ok ? "reachable" : "http-error",
      reachable: response.ok,
      httpStatus: response.status,
      finalUrl: response.url
    };
  } catch (error) {
    return {
      status: "unreachable",
      reachable: false,
      detail: error.name === "AbortError" ? `Timed out after ${timeoutMs}ms.` : error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkGitTags(url, version, timeoutMs = 20000) {
  const remote = gitUrl(url);
  if (!remote) return { status: "skipped", detail: "No repository URL." };
  let timeoutHandle;
  try {
    const { stdout } = await Promise.race([
      run("git", ["ls-remote", "--tags", "--refs", remote]),
      new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms.`)), timeoutMs);
      })
    ]);
    const tags = stdout
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => line.split(/\s+/)[1]?.replace(/^refs\/tags\//, ""))
      .filter(Boolean);
    const candidates = [...new Set([version, `v${version}`, `release-${version}`, `release/v${version}`].filter(Boolean))];
    const matches = candidates.filter((candidate) => tags.includes(candidate));
    return {
      status: matches.length ? "matching-tag-found" : "matching-tag-not-found",
      remote,
      checkedTagCount: tags.length,
      candidates,
      matches
    };
  } catch (error) {
    return { status: "git-query-failed", remote, detail: error.message };
  } finally {
    clearTimeout(timeoutHandle);
  }
}

export async function checkRepository(node, options = {}) {
  const url = repositoryUrlFromNode(node);
  const webCheck = await checkWebUrl(url, options.timeoutMs ?? 10000);
  const tagCheck = options.checkTags === false
    ? { status: "skipped", detail: "Tag checking disabled." }
    : await checkGitTags(url, node.version, options.gitTimeoutMs ?? 20000);

  return {
    package: { name: node.name, version: node.version, location: node.location },
    repositoryUrl: url,
    webCheck,
    tagCheck
  };
}

export async function verifyRepositories(report, options = {}) {
  if (!report || !Array.isArray(report.nodes)) {
    throw new TypeError("report must be a dependency report containing a nodes array.");
  }
  const concurrency = Math.max(1, Math.min(Number(options.concurrency) || 4, 12));
  const results = new Array(report.nodes.length);
  let next = 0;

  async function worker() {
    while (true) {
      const index = next++;
      if (index >= report.nodes.length) return;
      results[index] = await checkRepository(report.nodes[index], options);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, report.nodes.length) }, () => worker()));
  return {
    ...report,
    verificationGeneratedAt: new Date().toISOString(),
    repositoryChecks: results,
    verificationSummary: {
      packagesChecked: results.length,
      missingRepositoryUrl: results.filter((item) => !item.repositoryUrl).length,
      reachableRepositories: results.filter((item) => item.webCheck.reachable).length,
      unreachableRepositories: results.filter((item) => !item.webCheck.reachable).length,
      matchingTagsFound: results.filter((item) => item.tagCheck.status === "matching-tag-found").length,
      matchingTagsNotFound: results.filter((item) => item.tagCheck.status === "matching-tag-not-found").length
    }
  };
}

export async function cloneRepositories(report, destinationDirectory, options = {}) {
  if (!report || !Array.isArray(report.nodes)) {
    throw new TypeError("report must be a dependency report containing a nodes array.");
  }
  if (typeof destinationDirectory !== "string" || !destinationDirectory.trim()) {
    throw new TypeError("destinationDirectory must be a non-empty path.");
  }

  const destination = path.resolve(destinationDirectory);
  await fs.mkdir(destination, { recursive: true });
  const unique = new Map();

  for (const node of report.nodes) {
    const url = repositoryUrlFromNode(node);
    if (url && !unique.has(url)) unique.set(url, node);
  }

  const results = [];
  for (const [url, node] of unique) {
    const safeName = `${node.name}-${node.version ?? "unknown"}`
      .replace(/^@/, "")
      .replace(/[\\/]/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "-");
    const targetPath = path.join(destination, safeName);
    try {
      await fs.access(targetPath);
      results.push({ url, path: targetPath, status: "skipped-existing" });
      continue;
    } catch {
      // Directory does not exist; continue to clone.
    }

    try {
      await run("git", ["clone", "--depth", "1", gitUrl(url), targetPath]);
      results.push({ url, path: targetPath, status: "cloned" });
    } catch (error) {
      results.push({ url, path: targetPath, status: "clone-failed", detail: error.message });
      if (options.failFast) throw error;
    }
  }

  return {
    destination,
    repositoryCount: unique.size,
    results,
    summary: {
      cloned: results.filter((item) => item.status === "cloned").length,
      skippedExisting: results.filter((item) => item.status === "skipped-existing").length,
      failed: results.filter((item) => item.status === "clone-failed").length
    }
  };
}
