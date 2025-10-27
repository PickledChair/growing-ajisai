import { Span, spanToString } from "../parser/mod.ts";

export type SemantErrorInfo =
  { tag: "literalOutOfRange" };

export class SemantError {
  constructor(
    public readonly span: Span,
    public readonly errorInfo: SemantErrorInfo,
  ) {}

  private message1(): string {
    const info = this.errorInfo;
    switch (info.tag) {
      case "literalOutOfRange":
        return "literal out of range for `int`";
    }
  }

  message(): string {
    return `${spanToString(this.span)}\nsemantic error: ${this.message1()}`;
  }
}
