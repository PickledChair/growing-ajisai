import { AnalyzedExpr } from "../semant/mod.ts";

function makeCExpr(expr: AnalyzedExpr): string {
  switch (expr.tag) {
    case "binaryExpr":
      return `(${makeCExpr(expr.left)} ${expr.op} ${makeCExpr(expr.right)})`;
    case "unaryExpr":
      if (expr.op === "+") {
        return makeCExpr(expr.operand);
      } else {
        return `(${expr.op}${makeCExpr(expr.operand)})`;
      }
    case "intLit":
      return `${expr.value}`;
  }
}

export function codegen(ast: AnalyzedExpr, filePath: string) {
  // C 言語のソースコード
  const cSource = `#include <stdio.h>
#include <stdint.h>
#include <inttypes.h>

int main() {
  int64_t value = ${makeCExpr(ast)};
  printf("%" PRId64 "\\n", value);
  return 0;
}
`;

  // filePath に C ソースコードを書き込み
  try {
    const file = Deno.openSync(
      filePath,
      { write: true, create: true, truncate: true }
    );
    const encoder = new TextEncoder();
    file.writeSync(encoder.encode(cSource));
  } catch {
    console.error(`couldn't write C source to "${filePath}"`);
    Deno.exit(1);
  }
}
