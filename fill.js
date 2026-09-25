// fill.js：扫描线填充。行心取 y + 0.5，按 evenodd / nonzero 配对跨度。
import { degenerateError } from "./edge.js";

const EPSILON = 1e-9;

function normalize(edges) {
  return edges.map((edge) => {
    const topIsFirst = edge.y1 < edge.y2;
    const yTop = topIsFirst ? edge.y1 : edge.y2;
    const yBottom = topIsFirst ? edge.y2 : edge.y1;
    return {
      xTop: topIsFirst ? edge.x1 : edge.x2,
      yTop,
      yBottom,
      slope: (edge.x2 - edge.x1) / (edge.y2 - edge.y1), // dx/dy
      winding: topIsFirst ? 1 : -1,
      x: 0,
    };
  });
}

function scan(edges, rule) {
  const norm = normalize(edges);
  let rowMin = Infinity;
  let rowMax = -Infinity;
  for (const edge of norm) {
    // 半开区间 [yTop, yBottom)：顶点只算一次，自交不会弄乱游标
    edge.rowStart = Math.ceil(edge.yTop - 0.5 - EPSILON);
    edge.rowEnd = Math.ceil(edge.yBottom - 0.5 - EPSILON) - 1;
    if (edge.rowStart < rowMin) rowMin = edge.rowStart;
    if (edge.rowEnd > rowMax) rowMax = edge.rowEnd;
  }
  // 桶：每条边只进入自己纵向覆盖的扫描线区间，不做全表重排
  const buckets = new Map();
  for (const edge of norm) {
    if (edge.rowStart > edge.rowEnd) continue;
    const list = buckets.get(edge.rowStart);
    if (list) list.push(edge);
    else buckets.set(edge.rowStart, [edge]);
  }

  const spans = [];
  const active = [];
  for (let row = rowMin; row <= rowMax; row += 1) {
    const yc = row + 0.5;
    const incoming = buckets.get(row);
    if (incoming) {
      for (const edge of incoming) active.push(edge);
    }
    for (let i = active.length - 1; i >= 0; i -= 1) {
      if (active[i].yBottom <= yc) active.splice(i, 1);
    }
    if (active.length === 0) continue;
    for (const edge of active) {
      edge.x = edge.xTop + (yc - edge.yTop) * edge.slope;
    }
    // 活性边近有序，插入排序接近 O(n)
    for (let i = 1; i < active.length; i += 1) {
      const edge = active[i];
      let j = i - 1;
      while (j >= 0 && active[j].x > edge.x) {
        active[j + 1] = active[j];
        j -= 1;
      }
      active[j + 1] = edge;
    }

    const rowSpans = [];
    if (rule === "nonzero") {
      let winding = 0;
      let spanStart = null;
      for (const edge of active) {
        const before = winding;
        winding += edge.winding;
        if (before === 0 && winding !== 0) {
          spanStart = edge.x;
        } else if (before !== 0 && winding === 0 && spanStart !== null) {
          pushSpan(rowSpans, spanStart, edge.x);
          spanStart = null;
        }
      }
    } else {
      for (let i = 0; i + 1 < active.length; i += 2) {
        pushSpan(rowSpans, active[i].x, active[i + 1].x);
      }
    }
    if (rowSpans.length > 0) spans.push([row, rowSpans]);
  }
  return spans;
}

// 浮点交点区间 [xa, xb) 转像素跨度 [x1, x2)：像素 i 命中当且仅当行心 i + 0.5 落在区间内
function pushSpan(rowSpans, xa, xb) {
  const x1 = Math.ceil(xa - 0.5 - EPSILON);
  const x2 = Math.ceil(xb - 0.5 - EPSILON);
  if (x2 > x1) rowSpans.push([x1, x2]);
}

export function fill(edges, rule) {
  if (!Array.isArray(edges) || edges.length === 0) {
    throw degenerateError();
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const edge of edges) {
    minX = Math.min(minX, edge.x1, edge.x2);
    maxX = Math.max(maxX, edge.x1, edge.x2);
    minY = Math.min(minY, edge.y1, edge.y2);
    maxY = Math.max(maxY, edge.y1, edge.y2);
  }
  const area = (maxX - minX) * (maxY - minY);
  if (!(area > 0)) {
    throw degenerateError();
  }

  const spans = scan(edges, rule);
  let pixels = 0;
  for (const [, rowSpans] of spans) {
    for (const [x1, x2] of rowSpans) pixels += x2 - x1;
  }
  const coverage = Math.round((pixels / area) * 10000) / 10000;

  // 不变量自检：顶点顺序反向（等价于所有边反向）后跨度集合必须相同
  const reversed = edges
    .map((edge) => ({ x1: edge.x2, y1: edge.y2, x2: edge.x1, y2: edge.y1 }))
    .reverse();
  const reversedSpans = scan(reversed, rule);
  const invertedSame = JSON.stringify(spans) === JSON.stringify(reversedSpans);

  return { spans, pixels, coverage, inverted_same: invertedSame };
}
