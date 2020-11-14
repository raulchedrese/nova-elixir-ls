import { formattingCommand } from "../commands/formatting";

export default (
  disposable: CompositeDisposable,
  client: LanguageClient,
  config
) => (editor: TextEditor) => {
  if (editor.document.syntax !== "elixir") return;
  const editorDisposable = new CompositeDisposable();
  disposable.add(editor.onDidDestroy(() => editorDisposable.dispose()));

  editorDisposable.add(
    editor.onWillSave((editor) => {
      if (config.formatOnSave) {
        return formattingCommand(client, editor);
      }
    })
  );
};
