import { rangeToLspRange, lspRangeToRange } from "../novaUtils";
import { createLocationSearchResultsTree } from "../searchResults";

export const findReferences = (client, editor) => {
  const selectedRange = editor.selectedRange;
  const selectedText = editor.selectedText;

  client
    .sendRequest("textDocument/references", {
      textDocument: { uri: editor.document.uri },
      position: rangeToLspRange(editor.document, selectedRange),
      context: { includeDeclaration: false },
    })
    .then((result) => {
      const dataProvider = {
        getChildren(element) {
          console.log(element);
          return result.map((r) => r.uri);
        },
        getTreeItem(element) {
          console.log(element);
          return new TreeItem(element);
        },
      };

      const compositeDisposable = new CompositeDisposable();
      const treeView = new TreeView("raulchedrese.elixir-ls.sidebar.results", {
        dataProvider,
      });
      compositeDisposable.add(treeView);

      // createLocationSearchResultsTree(selectedText, result);
      // Open file
      result.map((r) => {
        console.log(Object.getOwnPropertyNames(r));
      });
    });
};
