import { formattingCommand } from "../commands/formatting";

export default (
  disposable: CompositeDisposable,
  getClient: () => LanguageClient | null
) => (editor: TextEditor) => {
  if (editor.document.syntax !== "elixir") return;
  const editorDisposable = new CompositeDisposable();
  disposable.add(editor.onDidDestroy(() => editorDisposable.dispose()));

  editorDisposable.add(
    editor.onWillSave((editor) => {
      if (!nova.config.get("elixir-ls.formatOnSave")) return;
      const client = getClient();
      if (!client) return;
      return formattingCommand(client, editor);
    })
  );

  // This triggers a recompile. This should be sent automatically by the Nova
  // LanguageClient but that does not seem to be happening so we send it
  // manually here.
  editorDisposable.add(
    editor.onDidSave((editor) => {
      const client = getClient();
      if (!client) return;
      client.sendNotification("textDocument/didSave", {
        textDocument: { uri: editor.document.uri },
      });
    })
  );
};
