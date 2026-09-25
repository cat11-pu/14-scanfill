// edge.js：边表与活性边表（闭合边表，水平边与退化边打标，扫描时排除）
export function buildEdges(points) {
  if (!Array.isArray(points) || points.length < 3) {
    throw degenerateError();
  }
  let twiceArea = 0;
  for (let index = 0; index < points.length; index += 1) {
    const a = points[index];
    const b = points[(index + 1) % points.length];
    twiceArea += a[0] * b[1] - b[0] * a[1];
  }
  if (twiceArea === 0) {
    throw degenerateError();
  }
  const edges = [];
  for (let index = 0; index < points.length; index += 1) {
    const a = points[index];
    const b = points[(index + 1) % points.length];
    edges.push({
      x1: a[0], y1: a[1], x2: b[0], y2: b[1],
      horizontal: a[1] === b[1],
      degenerate: a[0] === b[0] && a[1] === b[1],
    });
  }
  return edges;
}

function degenerateError() {
  const error = new Error("degenerate polygon");
  error.code = "E_DEGENERATE";
  return error;
}
