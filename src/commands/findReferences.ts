import { rangeToLspRange, jumpToRange } from "../novaUtils";
import { folderPath, fileName } from "../uri";
import type * as lspTypes from "vscode-languageserver-protocol";

export const findReferences = (client, editor) => {
  const selectedRange = editor.selectedRange;
  const selectedText = editor.selectedText;

  client
    .sendRequest("textDocument/references", {
      textDocument: { uri: editor.document.uri },
      position: rangeToLspRange(editor.document, selectedRange),
      context: { includeDeclaration: false },
    })
    .then((result: lspTypes.Location[]) => {
      const locationsByPath = result.reduce((acc, location) => {
        if (!acc[location.uri]) {
          acc[location.uri] = [];
        }
        acc[location.uri].push(location);
        return acc;
      }, {});

      const dataProvider = {
        getChildren(element: string | null): lspTypes.Location[] | string[] {
          if (element === null) {
            return Object.keys(locationsByPath);
          }
          return locationsByPath[element];
        },
        getTreeItem(element: lspTypes.Location | string) {
          if (typeof element !== "string") {
            const treeItem = new TreeItem(
              `${element.range.start.line}: ${selectedText}`
            );
            treeItem.command = "raulchedrese.elixir-ls.showReferences";
            return treeItem;
          }

          const treeItem = new TreeItem(
            fileName(element),
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

      if (!treeView.visible) {
        nova.workspace.showInformativeMessage(
          "Done! View the Elixir sidebar to see results."
        );
      }

      nova.commands.register("raulchedrese.elixir-ls.showReferences", () => {
        return Promise.all(
          treeView.selection.map((selection) => {
            if (typeof selection !== "string") {
              jumpToRange(nova.workspace, selection.uri, selection.range);
            }
          })
        );
      });
    });
};
