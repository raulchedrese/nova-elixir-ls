import { lspRangeToRange } from "../novaUtils";
import type * as lspTypes from "vscode-languageserver-protocol";

interface LSPFormattingResult {
  newText: string;
  range: lspTypes.Range;
}

export const formattingCommand = (
  client: LanguageClient,
  editor: TextEditor
) => {
  let uri = editor.document.uri;
  if (true) {
    uri = "file://" + uri.substring(uri.indexOf("/Users"));
  }

  return client
    .sendRequest("textDocument/formatting", {
      textDocument: { uri: editor.document.uri },
      options: {},
    })
    .then((result: LSPFormattingResult[]) => {
      editor.edit((edit) => {
        result.map((r) => {
          let novaRange = lspRangeToRange(editor.document, r.range);
          edit.replace(novaRange, r.newText);
        });
      });
    });
};
