import assert from "node:assert";
import { buildEdges } from "../edge.js";
import { fill } from "../fill.js";
import { render } from "../app.js";

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok   " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

const square = [[0, 0], [4, 0], [4, 4], [0, 4]];

check("buildEdges closes the loop", () => {
  assert.strictEqual(buildEdges([[0, 0], [4, 1], [2, 4]]).length, 3);
});

check("buildEdges keeps coordinates", () => {
  assert.strictEqual(buildEdges(square)[0].x1, 4);
});

check("fill returns spans", () => {
  assert.ok(Array.isArray(fill(buildEdges(square), "nonzero").spans));
});

check("fill reports pixels number", () => {
  assert.strictEqual(typeof fill(buildEdges(square), "nonzero").pixels, "number");
});

check("render echoes rule", () => {
  assert.strictEqual(render({ points: square, rule: "nonzero" }).rule, "nonzero");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
