#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { exploreAndClone } from "../src/v3/index.js";

const packageJson = JSON.parse(
  await fs.readFile(new URL("../package.json", import.meta.url), "utf8")
);
const VERSION = packageJson.version;

function help() {
  console.log(`npm-source-explorer v${VERSION}

Download and clone all upstream Git repositories for any npm package
and its dependencies as sibling folders in your workspace.

Usage:
  npm-source-explorer <package-name> [destination-folder]

Examples:
  npx @keshavsoft/npm-source-explorer express
  npx @keshavsoft/npm-source-explorer react ./react-sources
`);
}

async function main() {
  const args = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
  const flags = process.argv.slice(2).filter((arg) => arg.startsWith("-"));

  if (flags.includes("--version") || flags.includes("-v")) {
    console.log(VERSION);
    return;
  }

  if (flags.includes("--help") || flags.includes("-h") || args.length === 0) {
    help();
    return;
  }

  // Handle optional legacy command prefixes like "clone" or "analyze"
  if (["clone", "analyze", "verify"].includes(args[0]) && args[1]) {
    args.shift();
  }

  const packageSpec = args[0];
  const targetDir = args[1] ? path.resolve(args[1]) : process.cwd();

  console.log(`\n🔍 Exploring dependencies for "${packageSpec}"...`);

  const summary = await exploreAndClone(packageSpec, targetDir, {
    onProgress: (event) => {
      if (event.stage === "resolved") {
        console.log(`📦 Found ${event.totalPackages} packages (${event.uniqueCount} unique Git repositories).\n`);
      } else if (event.stage === "cloning") {
        const prefix = `[${event.index}/${event.total}] ${event.name}`;
        if (event.status === "cloned") {
          console.log(`  ⬇ ${prefix} -> cloned into ./${event.name}`);
        } else if (event.status === "skipped") {
          console.log(`  ⏩ ${prefix} -> skipped (already exists)`);
        } else if (event.status === "failed") {
          console.error(`  ❌ ${prefix} -> failed (${event.detail})`);
        }
      }
    }
  });

  console.log(`\n✨ Finished!`);
  console.log(`📁 Destination: ${summary.destination}`);
  console.log(`📊 Cloned: ${summary.clonedCount} | Skipped: ${summary.skippedCount} | Failed: ${summary.failedCount}\n`);
}

main().catch((error) => {
  console.error(`\nnpm-source-explorer error: ${error.message}\n`);
  process.exitCode = 1;
});
