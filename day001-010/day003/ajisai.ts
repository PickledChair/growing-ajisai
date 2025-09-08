import { Command } from "jsr:@cliffy/command@^1.0.0-rc.8";

type Span = {
  srcPath: string;
  srcContent: string;
  start: number;
  end: number;
};

function mergeSpans(span1: Span, span2: Span): Span | undefined {
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

function spanToString(span: Span): string {
  return `${spanToHeaderString(span)}:\n${spanToBodyString(span)}`;
}

type OpToken = {
  tag: "+" | "-" | "*" | "/" | "%";
};
type ParenToken = {
  tag: "(" | ")";
};
type IntToken = {
  tag: "integer";
  value: string;
};
type Token = (IntToken | OpToken | ParenToken) & { span: Span };

type SyntaxErrorInfo =
  { tag: "reachEOF" }
| { tag: "invalidChar" }
| { tag: "invalidNumLit" }
| { tag: "unreachable" };

class SyntaxError {
  constructor(
    public readonly span: Span,
    public readonly errorInfo: SyntaxErrorInfo,
  ) {}

  private message1(): string {
    switch (this.errorInfo.tag) {
      case "reachEOF":
        return "reach EOF";
      case "invalidChar":
        return "invalid character";
      case "invalidNumLit":
        return "invalid number literal";
      case "unreachable":
        return "unreachable (maybe compiler's bug)";
    }
  }

  message(): string {
    return `${spanToString(this.span)}\nsyntax error: ${this.message1()}`;
  }
}

class Lexer {
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
      return new SyntaxError(this.newSpan(startPos, this.#curPos + 1), { tag: "invalidNumLit"});

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

// build コマンドのオプションはなし
type Options = Record<string, never>;
// build コマンドの引数: <sourceFilePath:string>
type Arguments = [string];

// サブコマンド build の処理
function buildMain(_options: Options, ...args: Arguments) {
  // sourceFilePath の存在確認
  const [sourceFilePath] = args;
  try {
    const sourceFileStat = Deno.statSync(sourceFilePath);
    if (!sourceFileStat.isFile) {
      console.error(`"${sourceFilePath}" found, but not a file`);
      Deno.exit(1);
    }
  } catch {
    console.error(`"${sourceFilePath}" not found`);
    Deno.exit(1);
  }
  // Ajisai 言語のソースコードをファイルから読み込む
  const ajisaiSource = Deno.readTextFileSync(sourceFilePath);

  // とりあえず字句解析で得たトークン列からソースコードを再構築
  const lexer = new Lexer(sourceFilePath, ajisaiSource);
  let lexedSource = "";
  while (true) {
    const result = lexer.nextToken();
    if (result instanceof SyntaxError) {
      if (result.errorInfo.tag === "reachEOF") break;
      console.log(result.message());
      Deno.exit(1);
    }
    switch (result.tag) {
      case "integer":
        lexedSource += result.value;
        break;
      default:
        lexedSource += result.tag;
        break;
    }
  }

  // C 言語のソースコード
  const cSource = `#include <stdio.h>

int main() {
  printf("%d\\n", ${lexedSource});
  return 0;
}
`;

  // 出力ディレクトリ ajisai-out を準備
  const outputDirName = "ajisai-out";
  try {
    const distDirStat = Deno.statSync(outputDirName);
    if (!distDirStat.isDirectory) {
      console.error(`"${outputDirName}" found, but not a directory`);
      Deno.exit(1);
    }
  } catch {
    Deno.mkdirSync(outputDirName);
  }

  // ajisai-out/main.c に C ソースコードを書き込み
  const outputCFilePath = `${outputDirName}/main.c`;
  try {
    const outputCFile = Deno.openSync(
      outputCFilePath,
      { write: true, create: true, truncate: true },
    );
    const encoder = new TextEncoder();
    outputCFile.writeSync(encoder.encode(cSource));
  } catch {
    console.error(`couldn't write C source to "${outputCFilePath}"`);
    Deno.exit(1);
  }

  // C ソースをコンパイルして実行ファイル ajisai-out/main を出力
  const outputBinFilePath = `${outputDirName}/main`;
  const command = new Deno.Command("cc", {
    args: ["-o", outputBinFilePath, outputCFilePath],
    stdout: "inherit",
    stderr: "inherit",
  });
  const { code } = command.outputSync();
  Deno.exit(code);
}

const build = new Command()
  .arguments("<source:string>")
  .description("Create executable from source files.")
  .action(buildMain);

await new Command()
  .name("ajisai")
  .version("0.0.1")
  .description("Ajisai compiler")
  .command("build", build)
  .parse(Deno.args);
