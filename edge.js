// edge.js：边表构建。闭合多边形，排除水平边与退化边。
export function degenerateError() {
  const error = new Error("degenerate polygon");
  error.code = "E_DEGENERATE";
  return error;
}

export function buildEdges(points) {
  if (!Array.isArray(points) || points.length < 3) {
    throw degenerateError();
  }
  const edges = [];
  for (let index = 0; index < points.length; index += 1) {
    const a = points[index];
    const b = points[(index + 1) % points.length];
    if (a[0] === b[0] && a[1] === b[1]) {
      continue; // 退化边（零长度）
    }
    if (a[1] === b[1]) {
      continue; // 水平边不参与扫描线求交
    }
    edges.push({ x1: a[0], y1: a[1], x2: b[0], y2: b[1] });
  }
  return edges;
}
