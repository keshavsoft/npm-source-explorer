import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRepoUrl, toCloneUrl } from "../src/v7/git.js";
import { toSafeFolderName } from "../src/v7/naming.js";

test("V6 normalizes git+https repository URLs", () => {
  assert.equal(
    normalizeRepoUrl({ type: "git", url: "git+https://github.com/example/project.git" }),
    "https://github.com/example/project"
  );
});

test("V6 normalizes scp-style GitHub SSH URLs", () => {
  assert.equal(
    normalizeRepoUrl("git@github.com:example/project.git"),
    "https://github.com/example/project"
  );
});

test("V6 returns null for absent repository metadata", () => {
  assert.equal(normalizeRepoUrl(null), null);
  assert.equal(normalizeRepoUrl(undefined), null);
});

test("V6 converts HTTPS URLs to Git clone remotes", () => {
  assert.equal(
    toCloneUrl("https://github.com/keshavsoft/npm-source-explorer"),
    "https://github.com/keshavsoft/npm-source-explorer.git"
  );
  assert.equal(toCloneUrl(null), null);
});

test("V6 converts scoped package names into safe sibling folder names", () => {
  assert.equal(toSafeFolderName("@keshavsoft/npm-source-explorer"), "keshavsoft-npm-source-explorer");
  assert.equal(toSafeFolderName("express"), "express");
});
