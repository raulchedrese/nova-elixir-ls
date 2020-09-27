import { rangeToLspRange, lspRangeToRange } from "../novaUtils";
import { folderPath } from "../uri";

interface Location {
  uri: string;
  range: [number, number];
}

export const findReferences = (client, editor) => {
  const selectedRange = editor.selectedRange;
  const selectedText = editor.selectedText;

  client
    .sendRequest("textDocument/references", {
      textDocument: { uri: editor.document.uri },
      position: rangeToLspRange(editor.document, selectedRange),
      context: { includeDeclaration: false },
    })
    .then((result: Location[]) => {
      const dataProvider = {
        getChildren(element) {
          console.log(element);
          return result.map((r) => r);
        },
        getTreeItem(element: Location) {
          const treeItem = new TreeItem(element.uri.split("/").pop());
          treeItem.path = element.uri;
          treeItem.descriptiveText = folderPath(
            element.uri,
            nova.workspace.path
          );
          return treeItem;
        },
      };

      const compositeDisposable = new CompositeDisposable();
      const treeView = new TreeView("raulchedrese.elixir-ls.sidebar.results", {
        dataProvider,
      });
      compositeDisposable.add(treeView);
    });
};
