import { Span } from "./span.ts";

export type Expr =
(
  {
    tag: "binaryExpr";
    left: Expr;
    op: "+" | "-" | "*" | "/" | "%";
    right: Expr;
  }
| {
    tag: "unaryExpr";
    op: "+" | "-";
    operand: Expr;
  }
| {
    tag: "intLit";
    value: string;
  }
) & { span: Span };
