import { Span } from "../parser/mod.ts";
import type { Expr } from "../parser/mod.ts";
import { SemantError } from "./error.ts";

type BinaryOp = "+" | "-" | "*" | "/" | "%";
type UnaryOp = "+" | "-";

export type AnalyzedExpr =
(
  {
    tag: "binaryExpr";
    left: AnalyzedExpr;
    op: BinaryOp;
    right: AnalyzedExpr;
  }
| {
    tag: "unaryExpr";
    op: UnaryOp;
    operand: AnalyzedExpr;
  }
| {
    tag: "intLit";
    value: string;
  }
) & { span: Span };

export function analyzeExpr(expr: Expr): AnalyzedExpr | SemantError {
  switch (expr.tag) {
    case "binaryExpr":
      return analyzeBinary(expr.op, expr.left, expr.right, expr.span);
    case "unaryExpr":
      return analyzeUnary(expr.op, expr.operand, expr.span);
    case "intLit":
      return analyzeInteger(expr.value, expr.span);
  }
}

function analyzeBinary(op: BinaryOp, left: Expr, right: Expr, span: Span): AnalyzedExpr | SemantError {
  const left1 = analyzeExpr(left);
  if (left1 instanceof SemantError) return left1;

  const right1 = analyzeExpr(right);
  if (right1 instanceof SemantError) return right1;

  return { tag: "binaryExpr", op, left: left1, right: right1, span };
}

function analyzeUnary(op: UnaryOp, operand: Expr, span: Span): AnalyzedExpr | SemantError {
  const operand1 = analyzeExpr(operand);
  if (operand1 instanceof SemantError) return operand1;
  return { tag: "unaryExpr", op, operand: operand1, span };
}

function analyzeInteger(value: string, span: Span): AnalyzedExpr | SemantError {
  const intValue = BigInt(value);
  if (intValue <= 0x7fffffffffffffffn)
    return { tag: "intLit", value, span };
  else
    return new SemantError(span, { tag: "literalOutOfRange" });
}
