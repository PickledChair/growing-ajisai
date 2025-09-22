export type Span = {
  srcPath: string;
  srcContent: string;
  start: number;
  end: number;
};

export function mergeSpans(span1: Span, span2: Span): Span | undefined {
  if (span1.srcPath !== span2.srcPath) return undefined;
  return {
    srcPath: span1.srcPath,
    srcContent: span1.srcContent,
    start: span1.start < span2.start ? span1.start : span2.start,
    end: span1.end > span2.end ? span1.end : span2.end,
  };
}

function getRowAndColCount(pos: number, srcContent: string): [number, number] {
  let rowCount = 0;
  let rowStart = 0;
  for (let i = 0; i < pos; i++) {
    if (srcContent.at(i)! === "\n") {
      rowCount++;
      rowStart = i + 1;
    }
  }
  const colCount = pos - rowStart;
  return [rowCount, colCount];
}

function spanToHeaderString(span: Span): string {
  const [startRow, startCol] = getRowAndColCount(span.start, span.srcContent);
  const [endRow, endCol] = getRowAndColCount(span.end, span.srcContent);
  return `${span.srcPath}:${startRow+1}:${startCol+1}-${endRow+1}:${endCol}`;
}

function spanToBodyString(span: Span): string {
  // EOF に到達している時
  if (span.start >= span.srcContent.length) return "";

  let start = span.start;
  while (start > 0) {
    if (span.srcContent.at(start - 1)! === "\n") break;
    start--;
  }
  let end = span.end;
  while (end < span.srcContent.length) {
    if (span.srcContent.at(end)! === "\n") break;
    end++;
  }
  const spanString = span.srcContent.slice(start, end);
  const lines = spanString.split("\n");
  const spaceCount = span.start - start;
  return `${lines[0]!}\n${" ".repeat(spaceCount) + "^"}`;
}

export function spanToString(span: Span): string {
  return `${spanToHeaderString(span)}:\n${spanToBodyString(span)}`;
}
