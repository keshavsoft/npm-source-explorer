import test from "node:test";
import assert from "node:assert/strict";
import { parsePackageSpec } from "../src/v8/1-gatekeeper/index.js";
import {
  normalizeRepoUrl,
  toCloneUrl,
  extractGitHubOwner,
  toSafeFolderName,
  resolveRepositories
} from "../src/v8/3-detective/index.js";

test("Act 1 (Gatekeeper): parses package names and scopes", () => {
  const parsed = parsePackageSpec("@keshavsoft/json-renderers@1.2.0");
  assert.equal(parsed.name, "@keshavsoft/json-renderers");
  assert.equal(parsed.version, "1.2.0");
  assert.equal(parsed.owner, "keshavsoft");

  const simple = parsePackageSpec("express");
  assert.equal(simple.name, "express");
  assert.equal(simple.version, null);
  assert.equal(simple.owner, null);
});

test("Act 3 (Detective): normalizes git+https repository URLs", () => {
  assert.equal(
    normalizeRepoUrl({ type: "git", url: "git+https://github.com/example/project.git" }),
    "https://github.com/example/project"
  );
});

test("Act 3 (Detective): normalizes scp-style GitHub SSH URLs", () => {
  assert.equal(
    normalizeRepoUrl("git@github.com:example/project.git"),
    "https://github.com/example/project"
  );
});

test("Act 3 (Detective): returns null for absent repository metadata", () => {
  assert.equal(normalizeRepoUrl(null), null);
  assert.equal(normalizeRepoUrl(undefined), null);
});

test("Act 3 (Detective): converts HTTPS URLs to Git clone remotes", () => {
  assert.equal(
    toCloneUrl("https://github.com/keshavsoft/npm-source-explorer"),
    "https://github.com/keshavsoft/npm-source-explorer.git"
  );
  assert.equal(toCloneUrl(null), null);
});

test("Act 3 (Detective): extracts GitHub owner from repository URL", () => {
  assert.equal(
    extractGitHubOwner("https://github.com/keshavsoft/json-renderers"),
    "keshavsoft"
  );
  assert.equal(
    extractGitHubOwner("https://github.com/facebook/react.git"),
    "facebook"
  );
  assert.equal(extractGitHubOwner(null), null);
});

test("Act 3 (Detective): converts scoped package names into safe sibling folder names", () => {
  assert.equal(toSafeFolderName("@keshavsoft/npm-source-explorer"), "keshavsoft-npm-source-explorer");
  assert.equal(toSafeFolderName("express"), "express");
});

test("Act 3 (Detective): infers missing repositories using owner fallback", () => {
  const dependencies = [
    { name: "json-renderers", repository: "git+https://github.com/keshavsoft/json-renderers.git" },
    { name: "json-renderers-build-table", repository: null }
  ];

  const repos = resolveRepositories(dependencies);
  assert.equal(repos.length, 2);

  const table = repos.find((r) => r.name === "json-renderers-build-table");
  assert.ok(table);
  assert.equal(table.repoUrl, "https://github.com/keshavsoft/json-renderers-build-table");
  assert.equal(table.isInferred, true);
});
