import { Span } from "./span.ts";
import { Token } from "./token.ts";
import { SyntaxError } from "./error.ts";

export class Lexer {
  #curPos = 0;
  #tokenBuf: Token | SyntaxError | undefined = undefined;

  constructor(
    public readonly srcPath: string,
    public readonly srcContent: string,
  ) {}

  private newSpan(start: number, end: number): Span {
    return {
      srcPath: this.srcPath,
      srcContent: this.srcContent,
      start,
      end,
    };
  }

  private nextChar(): string | undefined {
    if (this.#curPos === this.srcContent.length) return undefined;
    const ch = this.srcContent[this.#curPos]!;
    this.#curPos++;
    return ch;
  }

  private peekChar(): string | undefined {
    if (this.#curPos === this.srcContent.length) return undefined;
    return this.srcContent[this.#curPos]!;
  }

  private isDigit(ch: string): boolean {
    return "0" <= ch && ch <= "9";
  }

  private readNumber(initial: string, startPos: number): Token | SyntaxError {
    let value = initial;
    let next = this.peekChar();

    // TODO: ２進数、１６進数等の数値リテラル
    // 実装するまでは、二桁以上の整数リテラルで先頭が 0 のケースは禁止する
    if (initial === "0" && next && this.isDigit(next))
      return new SyntaxError(this.newSpan(startPos, this.#curPos + 1), { tag: "invalidNumLit" });

    while (next && this.isDigit(next)) {
      this.nextChar();
      value += next;
      next = this.peekChar();
    }

    return { tag: "integer", value, span: this.newSpan(startPos, this.#curPos) };
  }

  private isPunct(ch: string): boolean {
    return !!["+", "-", "*", "/", "%", "(", ")"].find((punct) => punct === ch);
  }

  private readPunct(firstCh: string, startPos: number): Token | SyntaxError {
    switch (firstCh) {
      case "+":
        return { tag: "+", span: this.newSpan(startPos, this.#curPos) };
      case "-":
        return { tag: "-", span: this.newSpan(startPos, this.#curPos) };
      case "*":
        return { tag: "*", span: this.newSpan(startPos, this.#curPos) };
      case "/":
        return { tag: "/", span: this.newSpan(startPos, this.#curPos) };
      case "%":
        return { tag: "%", span: this.newSpan(startPos, this.#curPos) };
      case "(":
        return { tag: "(", span: this.newSpan(startPos, this.#curPos) };
      case ")":
        return { tag: ")", span: this.newSpan(startPos, this.#curPos) };
      default:
        return new SyntaxError(
          this.newSpan(startPos, this.#curPos),
          { tag: "unreachable" },
        );
    }
  }

  private nextTokenImpl(): Token | SyntaxError {
    let startPos = this.#curPos;

    while (true) {
      const ch = this.nextChar();
      if (!ch) return new SyntaxError(this.newSpan(startPos, this.#curPos), { tag: "reachEOF" });

      // 空白文字をスキップ
      if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
        startPos++;
        continue;
      }

      // 数値リテラル
      if (this.isDigit(ch)) return this.readNumber(ch, startPos);

      // 記号始まりの字句
      if (this.isPunct(ch)) return this.readPunct(ch, startPos);

      return new SyntaxError(this.newSpan(startPos, this.#curPos), { tag: "invalidChar" });
    }
  }

  private prepareTokenForPeek() {
    this.#tokenBuf = this.nextTokenImpl();
  }

  nextToken(): Token | SyntaxError {
    const curToken = this.#tokenBuf ?? this.nextTokenImpl();
    this.prepareTokenForPeek();
    return curToken;
  }

  peekToken(): Token | SyntaxError {
    if (!this.#tokenBuf) this.prepareTokenForPeek();
    return this.#tokenBuf!;
  }
}
