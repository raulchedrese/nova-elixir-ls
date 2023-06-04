import { findReferences } from "./commands/findReferences";
import handleAddTextEditor from "./handlers/handleAddTextEditor";
import { sendDidChangeConfigurationNotification } from "./notifications/didChangeConfiguration";
import { makeServerExecutable } from "./novaUtils";

export default class ElixirLanguageServer {
  languageClient: LanguageClient;
  mainDisposable: CompositeDisposable;

  constructor() {
    // Observe the configuration setting for the server's location, and restart the server on change
    nova.config.observe(
      "elixir-ls.language-server-path",
      function (path) {
        this.start(path);
      },
      this
    );
  }

  deactivate() {
    this.stop();
  }

  start(path: string) {
    if (this.languageClient) {
      this.languageClient.stop();
      nova.subscriptions.remove(this.languageClient);
    }

    makeServerExecutable();

    const client = this.createClient(path);

    this.mainDisposable = new CompositeDisposable();
    try {
      // Start the client
      client.start();

      // Add the client to the subscriptions to be cleaned up
      nova.subscriptions.add(client);
      this.languageClient = client;

      sendDidChangeConfigurationNotification(client, nova.config);

      // Find References
      nova.commands.register(
        "raulchedrese.elixir-ls.findReferences",
        (editor) => {
          findReferences(client, editor);
        }
      );

      // Format on Save
      nova.workspace.onDidAddTextEditor(
        handleAddTextEditor(
          this.mainDisposable,
          client,
          Boolean(nova.config.get("elixir-ls.formatOnSave"))
        )
      );
    } catch (err) {
      // If the .start() method throws, it's likely because the path to the language server is invalid

      if (nova.inDevMode()) {
        console.error(err);
      }
    }
  }

  createClient(path: string): LanguageClient {
    // Use the default server path
    if (!path || path === "") {
      path = nova.extension.path + "/elixir-ls-release/language_server.sh";
    }
    console.info("Using language server at %s", path)
    const serverOptions = {
      path: path,
    };
    const clientOptions = {
      syntaxes: ["elixir"],
    };
    return new LanguageClient(
      "elixir-ls-langserver",
      "Elixir Language Server",
      serverOptions,
      clientOptions
    );
  }

  stop() {
    if (this.languageClient) {
      this.languageClient.stop();
      nova.subscriptions.remove(this.languageClient);
      this.mainDisposable.dispose();
      this.languageClient = null;
    }
  }
}
