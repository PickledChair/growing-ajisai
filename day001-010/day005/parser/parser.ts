import { Expr } from "./ast.ts";
import { Lexer } from "./lexer.ts";
import { SyntaxError } from "./error.ts";
import { mergeSpans } from "./span.ts";
import { Token } from "./token.ts";

type TokenTag = Token["tag"];

export class Parser {
  #lexer: Lexer;

  constructor(srcPath: string, srcContent: string) {
    this.#lexer = new Lexer(srcPath, srcContent);
  }

  // expr = add
  parseExpr(): Expr | SyntaxError {
    return this.parseAdd();
  }

  // add = mul (("+" | "-") mul)*
  private parseAdd(): Expr | SyntaxError {
    let left = this.parseMul();
    if (left instanceof SyntaxError) return left;

    while (true) {
      const opToken = this.#lexer.peekToken();
      if (opToken instanceof SyntaxError) {
        if (opToken.errorInfo.tag === "reachEOF")
          return left;
        else
          return opToken;
      }

      let op: "+" | "-";
      switch (opToken.tag) {
        case "+":
        case "-":
          op = opToken.tag;
          break;
        default:
          return left;
      }
      this.#lexer.nextToken();

      const right = this.parseMul();
      if (right instanceof SyntaxError) {
        if (right.errorInfo.tag === "reachEOF")
          return new SyntaxError(opToken.span, { tag: "rhsNotFound" });
        else
          return right;
      };
      left = {
        tag: "binaryExpr",
        left, op, right,
        span: mergeSpans(left.span, right.span)!,
      };
    }
  }

  // mul = unary (("*" | "/" | "%") unary)*
  private parseMul(): Expr | SyntaxError {
    let left = this.parseUnary();
    if (left instanceof SyntaxError) return left;

    while (true) {
      const opToken = this.#lexer.peekToken();
      if (opToken instanceof SyntaxError) {
        if (opToken.errorInfo.tag === "reachEOF")
          return left;
        else
          return opToken;
      }

      let op: "*" | "/" | "%";
      switch (opToken.tag) {
        case "*":
        case "/":
        case "%":
          op = opToken.tag;
          break;
        default:
          return left;
      }
      this.#lexer.nextToken();

      const right = this.parseUnary();
      if (right instanceof SyntaxError) {
        if (right.errorInfo.tag === "reachEOF")
          return new SyntaxError(opToken.span, { tag: "rhsNotFound" });
        else
          return right;
      };
      left = {
        tag: "binaryExpr",
        left, op, right,
        span: mergeSpans(left.span, right.span)!,
      };
    }
  }

  // unary = ("+" | "-")* primary
  private parseUnary(): Expr | SyntaxError {
    const opToken = this.#lexer.peekToken();
    if (opToken instanceof SyntaxError) return opToken;

    switch (opToken.tag) {
      case "+":
      case "-": {
        this.#lexer.nextToken();

        const operand = this.parseUnary();
        if (operand instanceof SyntaxError) {
          if (operand.errorInfo.tag === "reachEOF")
            return new SyntaxError(opToken.span, { tag: "unaryOperandNotFound" });
          else
            return operand;
        }

        return {
          tag: "unaryExpr",
          op: opToken.tag,
          operand,
          span: mergeSpans(opToken.span, operand.span)!,
        };
      }
      default:
        break;
    }

    return this.parsePrimary();
  }

  // primary = ("(" expr ")") | integer
  private parsePrimary(): Expr | SyntaxError {
    if (this.eat("(")) {
      const expr = this.parseExpr();
      if (expr instanceof SyntaxError) return expr;
      const rParen = this.expect(")");
      if (rParen instanceof SyntaxError) return rParen;
      return expr;
    }

    const int = this.expect("integer");
    if (int instanceof SyntaxError) return int;
    switch (int.tag) {
      case "integer":
        return {
          tag: "intLit",
          value: int.value,
          span: int.span,
        };
      default:
        return new SyntaxError(int.span, { tag: "unreachable" });
    }
  }

  private eat(tag: TokenTag): Token | undefined {
    const token = this.#lexer.peekToken();
    if (token instanceof SyntaxError) return undefined;

    if (token.tag === tag) {
      this.#lexer.nextToken();
      return token;
    } else {
      return undefined;
    }
  }

  private expect(tag: TokenTag): Token | SyntaxError {
    const token = this.#lexer.peekToken();
    if (token instanceof SyntaxError) return token;

    if (token.tag === tag) {
      this.#lexer.nextToken();
      return token;
    } else {
      return new SyntaxError(
        token.span,
        { tag: "unexpectedToken", expected: tag, got: token },
      );
    }
  }
}

export function parse(srcPath: string, srcContent: string): Expr | SyntaxError {
  const parser = new Parser(srcPath, srcContent);
  return parser.parseExpr();
}
