import { assert, assertEquals } from "jsr:@std/assert@1.0";
import { parse, SyntaxError } from "../parser/mod.ts";

Deno.test("parse integer literal", () => {
  const source = "42";
  const ast = parse("", source);
  assert(!(ast instanceof SyntaxError));
  assert(ast.tag === "intLit");
  assertEquals(ast.value, "42");
});

Deno.test("parse integer 0", () => {
  const source = "0";
  const ast = parse("", source);
  assert(!(ast instanceof SyntaxError));
  assert(ast.tag === "intLit");
  assertEquals(ast.value, "0");
});

Deno.test("parse unary expression", () => {
  const source = "-+-42";
  const ast = parse("", source);
  assert(!(ast instanceof SyntaxError));

  assert(ast.tag === "unaryExpr");
  assertEquals(ast.op, "-");

  assert(ast.operand.tag === "unaryExpr");
  assertEquals(ast.operand.op, "+");

  assert(ast.operand.operand.tag === "unaryExpr");
  assertEquals(ast.operand.operand.op, "-");

  assert(ast.operand.operand.operand.tag === "intLit");
  assertEquals(ast.operand.operand.operand.value, "42");
});

Deno.test("parse binary expression", () => {
  const source = "(10 + 11) * 2";
  const ast = parse("", source);
  assert(!(ast instanceof SyntaxError));

  assert(ast.tag === "binaryExpr");
  assertEquals(ast.op, "*");

  assert(ast.left.tag === "binaryExpr");
  assertEquals(ast.left.op, "+");
  assert(ast.left.left.tag === "intLit");
  assertEquals(ast.left.left.value, "10");
  assert(ast.left.right.tag === "intLit");
  assertEquals(ast.left.right.value, "11");

  assert(ast.right.tag === "intLit");
  assertEquals(ast.right.value, "2");
});

Deno.test("parse unary and binary expressions", () => {
  const source = "+123---456";
  const ast = parse("", source);
  assert(!(ast instanceof SyntaxError));

  assert(ast.tag === "binaryExpr");
  assertEquals(ast.op, "-");

  assert(ast.left.tag === "unaryExpr");
  assertEquals(ast.left.op, "+");
  assert(ast.left.operand.tag === "intLit");
  assertEquals(ast.left.operand.value, "123");

  assert(ast.right.tag === "unaryExpr");
  assertEquals(ast.right.op, "-");
  assert(ast.right.operand.tag === "unaryExpr");
  assertEquals(ast.right.operand.op, "-");
  assert(ast.right.operand.operand.tag === "intLit");
  assertEquals(ast.right.operand.operand.value, "456");
});
