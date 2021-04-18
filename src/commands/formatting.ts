import { lspRangeToRange } from "../novaUtils";
import type * as lspTypes from "vscode-languageserver-protocol";
import { folderPath } from '../uri';

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
  console.log("DOC URI");
  console.log(editor.document.uri);
  console.log(uri);
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
//Volumes/Macintosh HD/Users/raulchedrese/projects/hack_assembler/lib/virtual_machine/