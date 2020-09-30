import { rangeToLspRange, jumpToRange } from "../novaUtils";

export const goToDefinition = (client, editor) => {
  const selectedRange = editor.selectedRange;

  client
    .sendRequest("textDocument/definition", {
      textDocument: { uri: editor.document.uri },
      position: rangeToLspRange(editor.document, selectedRange),
    })
    .then((result) => {
      jumpToRange(nova.workspace, result.uri, result.range);
    });
};
