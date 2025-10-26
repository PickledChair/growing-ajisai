import { assert, assertEquals } from "jsr:@std/assert@1.0";
import { parse, SyntaxError } from "../parser/mod.ts";
import { analyzeExpr, SemantError } from "../semant/mod.ts";

Deno.test("valid integer literal", () => {
  const source = "9223372036854775807";
  const ast = parse("", source);
  assert(!(ast instanceof SyntaxError));
  const analyzedAst = analyzeExpr(ast);
  assert(!(analyzedAst instanceof SemantError));
});

Deno.test("too large integer literal", () => {
  const source = "9223372036854775808";
  const ast = parse("", source);
  assert(!(ast instanceof SyntaxError));
  const analyzedAst = analyzeExpr(ast);
  assert(analyzedAst instanceof SemantError);
  assertEquals(analyzedAst.errorInfo.tag, "tooLargeIntLiteral");
});
