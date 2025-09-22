import { Span, spanToString } from "./span.ts";
import { Token } from "./token.ts";

type TokenTag = Token["tag"];

export type SyntaxErrorInfo =
// for Lexer
  { tag: "reachEOF" }
| { tag: "invalidChar" }
| { tag: "invalidNumLit" }
// for Parser
| { tag: "unexpectedToken", expected: TokenTag, got: Token }
| { tag: "rhsNotFound" }
| { tag: "unaryOperandNotFound" }
| { tag: "unreachable" };

export class SyntaxError {
  constructor(
    public readonly span: Span,
    public readonly errorInfo: SyntaxErrorInfo,
  ) {}

  private message1(): string {
    const info = this.errorInfo;
    switch (info.tag) {
      case "reachEOF":
        return "reach EOF";
      case "invalidChar":
        return "invalid character";
      case "invalidNumLit":
        return "invalid number literal";
      case "unexpectedToken":
        return `unexpected token: expected \`${info.expected}\`, but got \`${info.got.tag}\``;
      case "rhsNotFound":
        return "binary expression has no right-hand operand";
      case "unaryOperandNotFound":
        return "unary expression has no operand";
      case "unreachable":
        return "unreachable (maybe compiler's bug)";
    }
  }

  message(): string {
    return `${spanToString(this.span)}\nsyntax error: ${this.message1()}`;
  }
}
