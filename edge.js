// edge.js：边表与活性边表（基线：不做排序、不排除水平边）
export function buildEdges(points) {
  const edges = [];
  for (let index = 0; index < points.length; index += 1) {
    const a = points[index];
    const b = points[(index + 1) % points.length];
    edges.push({ x1: a[0], y1: a[1], x2: b[0], y2: b[1] });
  }
  return edges;
}
