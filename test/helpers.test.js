import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRepoUrl, toCloneUrl } from "../src/v3/git.js";

test("V3 normalizes git+https repository URLs", () => {
  assert.equal(
    normalizeRepoUrl({ type: "git", url: "git+https://github.com/example/project.git" }),
    "https://github.com/example/project"
  );
});

test("V3 normalizes scp-style GitHub SSH URLs", () => {
  assert.equal(
    normalizeRepoUrl("git@github.com:example/project.git"),
    "https://github.com/example/project"
  );
});

test("V3 returns null for absent repository metadata", () => {
  assert.equal(normalizeRepoUrl(null), null);
  assert.equal(normalizeRepoUrl(undefined), null);
});

test("V3 converts HTTPS URLs to Git clone remotes", () => {
  assert.equal(
    toCloneUrl("https://github.com/keshavsoft/npm-source-explorer"),
    "https://github.com/keshavsoft/npm-source-explorer.git"
  );
  assert.equal(toCloneUrl(null), null);
});
