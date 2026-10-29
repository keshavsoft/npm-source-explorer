#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeDependencies } from "../src/V1/index.js";
import { verifyRepositories, cloneRepositories } from "../src/V2/index.js";

const VERSION = "0.1.0";

function help() {
  console.log(`npm-source-explorer ${VERSION}

Usage:
  npm-source-explorer analyze <package-spec> [--out <file>] [--no-optional]
  npm-source-explorer verify  <package-spec> [--out <file>] [--no-optional]
  npm-source-explorer clone   <package-spec> [--clone-dir <dir>] [--no-optional]

Commands:
  analyze  Resolve and export a dependency graph.
  verify   Analyze dependencies and check repository URLs and version tags.
  clone    Analyze dependencies and clone each distinct recorded repository.

Options:
  --out <file>        Write JSON output to a file instead of stdout.
  --clone-dir <dir>   Directory to receive cloned repositories (default: ./npm-source-explorer-sources).
  --no-optional       Exclude optional dependencies from the graph.
  --help, -h          Show this help.
  --version, -v       Show the CLI version.
`);
}

function parseArgs(args) {
  const positional = [];
  const options = { includeOptional: true };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--version" || arg === "-v") options.version = true;
    else if (arg === "--no-optional") options.includeOptional = false;
    else if (arg === "--out" || arg === "--clone-dir") {
      const value = args[++i];
      if (!value || value.startsWith("--")) throw new Error(`${arg} requires a value.`);
      options[arg === "--out" ? "out" : "cloneDir"] = value;
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    } else positional.push(arg);
  }
  return { positional, options };
}

async function emitJson(data, outputPath) {
  const json = `${JSON.stringify(data, null, 2)}\n`;
  if (!outputPath) {
    process.stdout.write(json);
    return;
  }
  const absolute = path.resolve(outputPath);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, json, "utf8");
  console.error(`Wrote ${absolute}`);
}

async function main() {
  const { positional, options } = parseArgs(process.argv.slice(2));
  if (options.version) {
    console.log(VERSION);
    return;
  }
  if (options.help || positional.length === 0) {
    help();
    return;
  }

  const command = positional[0];
  if (!["analyze", "verify", "clone"].includes(command)) {
    throw new Error(`Unknown command "${command}". Run with --help.`);
  }
  const packageSpec = positional[1];
  if (!packageSpec) throw new Error(`The ${command} command requires a package spec.`);

  console.error(`Resolving ${packageSpec}...`);
  const report = await analyzeDependencies(packageSpec, {
    includeOptional: options.includeOptional
  });

  if (command === "analyze") {
    await emitJson(report, options.out);
    return;
  }
  if (command === "verify") {
    console.error(`Checking repository metadata for ${report.nodes.length} package instances...`);
    const verified = await verifyRepositories(report);
    await emitJson(verified, options.out);
    return;
  }

  const cloneDir = options.cloneDir ?? "./npm-source-explorer-sources";
  const result = await cloneRepositories(report, cloneDir);
  await emitJson(result, options.out);
}

main().catch((error) => {
  console.error(`npm-source-explorer: ${error.message}`);
  process.exitCode = 1;
});
