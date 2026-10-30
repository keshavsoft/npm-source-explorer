import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRepositoryUrl, getRepositoryInfo } from "../src/v1/index.js";

test("normalizes git+https repository URLs", () => {
  assert.equal(
    normalizeRepositoryUrl({ type: "git", url: "git+https://github.com/example/project.git" }),
    "https://github.com/example/project"
  );
});

test("normalizes scp-style GitHub SSH URLs", () => {
  assert.equal(
    normalizeRepositoryUrl("git@github.com:example/project.git"),
    "https://github.com/example/project"
  );
});

test("returns null for absent repository metadata", () => {
  assert.equal(normalizeRepositoryUrl(null), null);
  assert.deepEqual(getRepositoryInfo(undefined), { raw: null, normalizedUrl: null });
});
