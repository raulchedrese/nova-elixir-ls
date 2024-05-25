import { lspRangeToRange } from "../novaUtils";
import type * as lspTypes from "vscode-languageserver-protocol";

interface LSPFormattingResult {
  newText: string;
  range: lspTypes.Range;
}

export const codeLensCommand = (
  client: LanguageClient,
  editor: TextEditor
) => {
  console.log(editor.document.uri)
  return client
    .sendRequest("textDocument/codeLens", {
      textDocument: { uri: editor.document.uri },
    })
    .then((result: any) => {
      console.log(Object.getOwnPropertyNames(result))
      console.log(result.length)
    });
};
