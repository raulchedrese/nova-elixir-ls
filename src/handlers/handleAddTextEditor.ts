import { formattingCommand } from "../commands/formatting";
import { codeLensCommand } from "../commands/codeLens"

export default (
  disposable: CompositeDisposable,
  client: LanguageClient,
  formatOnSave
) => (editor: TextEditor) => {
  if (editor.document.syntax !== "elixir") return;
  const editorDisposable = new CompositeDisposable();
  disposable.add(editor.onDidDestroy(() => editorDisposable.dispose()));
  
  // codeLensCommand(client, editor)

  // editorDisposable.add(
  //   editor.onWillSave((editor) => {
  //     if (config.formatOnSave) {
  //       return formattingCommand(client, editor);
  //     }
  //   })
  // );
  
  // editorDisposable.add(
  //   editor.onDidSave((editor) => {
  //     codeLensCommand(client, editor);
  //   })
  // )
};
