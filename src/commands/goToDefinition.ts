import { rangeToLspRange, jumpToRange } from "../novaUtils";

export const goToDefinition = (client: LanguageClient, editor: TextEditor) => {
  const selectedRange = editor.selectedRange;

  client
    .sendRequest("textDocument/definition", {
      textDocument: { uri: editor.document.uri },
      position: rangeToLspRange(editor.document, selectedRange),
    })
    .then((result: any) => {
      jumpToRange(nova.workspace, result.uri, result.range);
    });
};
