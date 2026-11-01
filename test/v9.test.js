import test from "node:test";
import assert from "node:assert/strict";
import { explore, resolveDependencyRepos, cloneSiblings } from "../src/v9/index.js";

test("V9 Engine: exports explore orchestrator and decoupled modules", () => {
  assert.equal(typeof explore, "function");
  assert.equal(typeof resolveDependencyRepos, "function");
  assert.equal(typeof cloneSiblings, "function");
});

