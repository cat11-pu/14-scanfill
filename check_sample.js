import fs from "node:fs";
import { buildEdges } from "./edge.js";
import { fill } from "./fill.js";
import { render } from "./app.js";

const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/poly.json", "utf8"));
const edges = buildEdges(spec.points);
const result = fill(edges, spec.rule);
const out = render(spec);

console.log("每行的填充跨度 =", JSON.stringify(result.spans));
console.log("填充的像素数 =", result.pixels);
console.log("环绕规则 =", spec.rule);
console.log("采样点覆盖率 =", result.coverage);
console.log("顶点反向后的跨度是否相同 =", result.inverted_same);
console.log("退化边的错误码 =", spec.degenerate_code);
