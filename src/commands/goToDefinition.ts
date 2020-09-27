import { rangeToLspRange, lspRangeToRange } from "../novaUtils";

export const goToDefinition = (client, editor) => {
  const selectedRange = editor.selectedRange;

  client
    .sendRequest("textDocument/definition", {
      textDocument: { uri: editor.document.uri },
      position: rangeToLspRange(editor.document, selectedRange),
    })
    .then((result) => {
      // Open file
      nova.workspace.openFile(result.uri).then((newEditor) => {
        const range = lspRangeToRange(newEditor.document, result.range);

        newEditor.addSelectionForRange(range);
        newEditor.scrollToPosition(range.start);
      });
    });
};
