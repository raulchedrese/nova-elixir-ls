import { findReferences } from "./commands/findReferences";
import handleStop from "./handlers/handleStop";
import handleAddTextEditor from "./handlers/handleAddTextEditor";
import { makeServerExecutable } from "./novaUtils";

interface Config {
  formatOnSave: boolean;
  enableLanguageServer: boolean;
  serverPath: string;
}

let langClient = null;
const mainDisposable = new CompositeDisposable();
let config = {
  formatOnSave: false,
  enableLanguageServer: true,
  serverPath: "",
};

export const activate = function () {
  console.log("activating Elixir LS...");
  nova.config.observe("elixir-ls.format-on-save", function (isOn: boolean) {
    config.formatOnSave = isOn;
  });

  nova.config.observe("elixir-ls.language-server-path", function (
    path: string
  ) {
    config.serverPath = path;
    startServer(config);
  });

  nova.config.observe("elixir-ls.enable-language-server", function (
    enable: boolean
  ) {
    config.enableLanguageServer = enable;
  });
};

export const deactivate = function () {
  stopServer();
};

const startServer = (config: Config) => {
  if (langClient) {
    langClient.stop();
    nova.subscriptions.remove(langClient);
  }

  if (!config.enableLanguageServer) {
    return;
  }

  makeServerExecutable();

  const defaultPath =
    nova.extension.path + "/elixir-ls-release/language_server.sh";

  // Create the client
  const serverOptions = {
    path: config.serverPath ? config.serverPath : defaultPath,
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

    mainDisposable.add(client.onDidStop(handleStop()));

    // Can be used to set custom `projectDir` or `mixEnv`. If we don't call this it sends
    // a warning notification.
    client.sendNotification("workspace/didChangeConfiguration", {
      settings: {
        elixirLS: {
          dialyzerEnabled: true,
          dialyzerFormat: true,
        },
      },
    });

    // Add the client to the subscriptions to be cleaned up
    nova.subscriptions.add(client);
    langClient = client;

    // Find References
    nova.commands.register(
      "raulchedrese.elixir-ls.findReferences",
      (editor) => {
        findReferences(client, editor);
      }
    );

    // Format on Save
    mainDisposable.add(
      nova.workspace.onDidAddTextEditor(
        handleAddTextEditor(mainDisposable, client, config)
      )
    );
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
    mainDisposable.dispose();
    langClient = null;
  }
};

const restart = () => {
  stopServer();
  console.log("restarting Elixir LS...");
  startServer(config);
};

nova.commands.register("raulchedrese.elixir-ls.restart", restart);
