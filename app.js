// app.js：渲染结果
import { buildEdges } from "./edge.js";
import { fill } from "./fill.js";

export function render(spec) {
  const edges = buildEdges(spec.points);
  const result = fill(edges, spec.rule);
  return { spans: result.spans, pixels: result.pixels, rule: spec.rule,
           coverage: result.coverage, inverted_same: result.inverted_same };
}
