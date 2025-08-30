import { Command } from "jsr:@cliffy/command@^1.0.0-rc.8";

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

  // C 言語のソースコード
  const cSource = `#include <stdio.h>

int main() {
  printf("%d\\n", ${ajisaiSource});
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
