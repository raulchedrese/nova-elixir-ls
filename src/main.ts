import { formattingCommand } from "./commands/formatting";
import { goToDefinition } from "./commands/goToDefinition";
import { findReferences } from "./commands/findReferences";

let langClient = null;
let config = {
  formatOnSave: false,
  serverPath: "",
};

export const activate = function () {
  nova.config.observe("elixir-ls.format-on-save", function (isOn: boolean) {
    config.formatOnSave = isOn;
  });

  nova.config.observe("elixir-ls.language-server-path", function (
    path: string
  ) {
    config.serverPath = path;
    startServer(path);
  });
};

export const deactivate = function () {
  stopServer();
};

const startServer = (path: string) => {
  if (langClient) {
    langClient.stop();
    nova.subscriptions.remove(langClient);
  }

  // Use the default server path
  if (!path) {
    path = nova.extension.path + "/elixir-ls-release/language_server.sh";
  }

  // Create the client
  const serverOptions = {
    path: path,
  };
  const clientOptions = {
    // The set of document syntaxes for which the server is valid
    syntaxes: ["elixir"],
  };
  const client: any = new LanguageClient(
    "elixir-ls-langserver",
    "Elixir Language Server",
    serverOptions,
    clientOptions
  );

  try {
    // Start the client
    client.start();

    // Can be used to set custom `projectDir` or `mixEnv`. If we don't call this it sends
    // a warning notification.
    client.sendNotification("workspace/didChangeConfiguration", {
      settings: {},
    });

    // Add the client to the subscriptions to be cleaned up
    nova.subscriptions.add(client);
    langClient = client;

    // Go to Definition
    // nova.commands.register(
    //   "raulchedrese.elixir-ls.goToDefinition",
    //   (editor) => {
    //     goToDefinition(client, editor);
    //   }
    // );

    // Find References
    nova.commands.register(
      "raulchedrese.elixir-ls.findReferences",
      (editor) => {
        findReferences(client, editor);
      }
    );

    // Format on Save
    nova.workspace.onDidAddTextEditor((editor) => {
      if (editor.document.syntax !== "elixir") return;
      editor.onWillSave((editor) => {
        if (config.formatOnSave) {
          return formattingCommand(client, editor);
        }
      });

      editor.onDidSave((editor) => {
        client.sendNotification("textDocument/didSave", {
          textDocument: { uri: editor.document.uri },
        });
      });
    });
  } catch (err) {
    // If the .start() method throws, it's likely because the path to the language server is invalid

    if (nova.inDevMode()) {
      console.error(err);
    }
  }
};

const stopServer = () => {
  if (langClient) {
    langClient.stop();
    nova.subscriptions.remove(langClient);
    langClient = null;
  }
};
