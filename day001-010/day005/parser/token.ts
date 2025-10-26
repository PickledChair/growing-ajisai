import { Span } from "./span.ts";

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
export type Token = (IntToken | OpToken | ParenToken) & { span: Span };
