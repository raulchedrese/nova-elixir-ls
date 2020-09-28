import { lspRangeToRange } from "../novaUtils";

export const formattingCommand = (client, editor) => {
  return client
    .sendRequest("textDocument/formatting", {
      textDocument: { uri: editor.document.uri },
      options: {},
    })
    .then((result) => {
      editor.edit((edit) => {
        result.map((r) => {
          edit.replace(lspRangeToRange(editor.document, r.range), r.newText);
        });
      });
    });
};
