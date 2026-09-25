// fill.js：扫描与环绕（行心取 y+0.5，活性边表按行桶调度）
export function fill(edges, rule) {
  const usable = [];
  for (const edge of edges) {
    if (edge.horizontal || edge.degenerate) continue;
    if (edge.y1 === edge.y2 || (edge.x1 === edge.x2 && edge.y1 === edge.y2)) continue;
    usable.push(edge);
  }
  if (usable.length === 0) {
    const error = new Error("degenerate polygon");
    error.code = "E_DEGENERATE";
    throw error;
  }

  const spans = scanSpans(usable, rule);
  const reversed = usable.map((edge) => ({
    x1: edge.x2, y1: edge.y2, x2: edge.x1, y2: edge.y1,
  }));
  const invertedSpans = scanSpans(reversed, rule);

  let pixels = 0;
  for (const [, rowSpans] of spans) {
    for (const [x1, x2] of rowSpans) pixels += x2 - x1;
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const edge of usable) {
    minX = Math.min(minX, edge.x1, edge.x2);
    maxX = Math.max(maxX, edge.x1, edge.x2);
    minY = Math.min(minY, edge.y1, edge.y2);
    maxY = Math.max(maxY, edge.y1, edge.y2);
  }
  const boxArea = (maxX - minX) * (maxY - minY);
  const coverage = boxArea > 0 ? Math.round((pixels / boxArea) * 10000) / 10000 : 0;

  return {
    spans: spans,
    pixels: pixels,
    coverage: coverage,
    inverted_same: JSON.stringify(spans) === JSON.stringify(invertedSpans),
  };
}

function scanSpans(edges, rule) {
  let rowMin = Infinity;
  let rowMax = -Infinity;
  const prepared = edges.map((edge) => {
    const yLo = Math.min(edge.y1, edge.y2);
    const yHi = Math.max(edge.y1, edge.y2);
    const first = Math.ceil(yLo - 0.5);
    const last = Math.ceil(yHi - 0.5) - 1;
    rowMin = Math.min(rowMin, first);
    rowMax = Math.max(rowMax, last);
    return {
      x1: edge.x1, y1: edge.y1, x2: edge.x2, y2: edge.y2,
      first: first, last: last,
      dir: edge.y2 > edge.y1 ? 1 : -1,
    };
  });

  const buckets = new Map();
  for (const edge of prepared) {
    if (!buckets.has(edge.first)) buckets.set(edge.first, []);
    buckets.get(edge.first).push(edge);
  }

  const spans = [];
  let active = [];
  for (let row = rowMin; row <= rowMax; row += 1) {
    active = active.filter((edge) => edge.last >= row);
    const entering = buckets.get(row);
    if (entering) active = active.concat(entering);
    if (active.length === 0) continue;

    const ys = row + 0.5;
    const crossings = [];
    for (const edge of active) {
      const x = edge.x1 + ((ys - edge.y1) * (edge.x2 - edge.x1)) / (edge.y2 - edge.y1);
      crossings.push({ x: x, dir: edge.dir });
    }
    crossings.sort((a, b) => a.x - b.x);

    const rowSpans = [];
    if (rule === "nonzero") {
      let winding = 0;
      let open = 0;
      for (const crossing of crossings) {
        const next = winding + crossing.dir;
        if (winding === 0 && next !== 0) open = crossing.x;
        if (winding !== 0 && next === 0) pushSpan(rowSpans, open, crossing.x);
        winding = next;
      }
    } else {
      for (let index = 0; index + 1 < crossings.length; index += 2) {
        pushSpan(rowSpans, crossings[index].x, crossings[index + 1].x);
      }
    }
    if (rowSpans.length > 0) spans.push([row, rowSpans]);
  }
  return spans;
}

function pushSpan(rowSpans, xLeft, xRight) {
  const x1 = Math.ceil(xLeft - 0.5);
  const x2 = Math.floor(xRight - 0.5) + 1;
  if (x1 < x2) rowSpans.push([x1, x2]);
}
