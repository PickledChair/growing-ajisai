import { Span, spanToString } from "../parser/mod.ts";

export type SemantErrorInfo =
  { errorKind: "valueError", tag: "tooLargeIntLiteral" }

export class SemantError {
  constructor(
    public readonly span: Span,
    public readonly errorInfo: SemantErrorInfo,
  ) {}

  private message1(): string {
    const info = this.errorInfo;
    switch (info.errorKind) {
      case "valueError": {
        const errKind = "value error: ";
        switch (info.tag) {
          case "tooLargeIntLiteral":
            return errKind + "integer literal is too large";
        }
      }
    }
  }

  message(): string {
    return `${spanToString(this.span)}\n${this.message1()}`;
  }
}
