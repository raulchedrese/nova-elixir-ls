import { rangeToLspRange, lspRangeToRange } from "../novaUtils";
import { folderPath } from "../uri";

interface Location {
  uri: string;
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
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
      const locationsByPath = result.reduce((acc, location) => {
        if (!acc[location.uri]) {
          acc[location.uri] = [];
        }
        acc[location.uri].push(location);
        return acc;
      }, {});

      const dataProvider = {
        getChildren(element: string | null): Location[] | string[] {
          if (element === null) {
            return Object.keys(locationsByPath);
          }
          return locationsByPath[element];
        },
        getTreeItem(element: Location | string) {
          if (typeof element !== "string") {
            const treeItem = new TreeItem(
              `${element.range.start.line}: ${selectedText}`
            );
            treeItem.command = "raulchedrese.elixir-ls.showReferences";
            return treeItem;
          }

          const treeItem = new TreeItem(
            element.split("/").pop(),
            TreeItemCollapsibleState.Expanded
          );
          treeItem.path = element;
          treeItem.descriptiveText = folderPath(element, nova.workspace.path);
          return treeItem;
        },
      };

      const treeView = new TreeView("raulchedrese.elixir-ls.sidebar.results", {
        dataProvider,
      });

      nova.commands.register("raulchedrese.elixir-ls.showReferences", () => {
        return Promise.all(
          treeView.selection.map((selection) => {
            if (typeof selection !== "string") {
              nova.workspace.openFile(selection.uri).then((newEditor) => {
                const range = lspRangeToRange(
                  newEditor.document,
                  selection.range
                );

                newEditor.addSelectionForRange(range);
                newEditor.scrollToPosition(range.start);
              });
            }
          })
        );
      });
    });
};
