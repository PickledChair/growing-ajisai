export type { Span } from "./span.ts";
export { mergeSpans, spanToString } from "./span.ts";

export type { SyntaxErrorInfo } from "./error.ts";
export { SyntaxError } from "./error.ts";

export { Lexer } from "./lexer.ts";

export type { Expr } from "./ast.ts";
export { Parser, parse } from "./parser.ts";
