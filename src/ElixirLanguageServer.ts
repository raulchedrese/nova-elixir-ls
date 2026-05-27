import { findReferences } from "./commands/findReferences";
import handleAddTextEditor from "./handlers/handleAddTextEditor";
import { sendDidChangeConfigurationNotification } from "./notifications/didChangeConfiguration";
import { makeServerExecutable } from "./novaUtils";
import { findExpertBinary, installExpert } from "./expert";

type ServerKind = "elixirLS" | "expert";

// Nova's LanguageClient API has no `cwd` option and spawns the server with cwd
// "/". That breaks tool-version managers (mise, asdf) that key off the project
// directory, and breaks Expert which writes a log file under cwd. Wrap the
// invocation in /bin/sh -c so we can cd before exec'ing the real server.
function shellQuote(s: string): string {
  return `'${s.replace(/'/g, "'\\''")}'`;
}

function serverOptionsForCwd(
  path: string,
  args: string[],
  cwd: string | null
) {
  if (!cwd) {
    return { path, args };
  }
  const parts = [shellQuote(path), ...args.map(shellQuote)];
  return {
    path: "/bin/sh",
    args: ["-c", `cd ${shellQuote(cwd)} && exec ${parts.join(" ")}`],
  };
}

export default class ElixirLanguageServer {
  languageClient: LanguageClient | null = null;
  mainDisposable: CompositeDisposable;
  installing = false;

  constructor() {
    this.mainDisposable = new CompositeDisposable();

    this.mainDisposable.add(
      nova.commands.register(
        "raulchedrese.elixir-ls.findReferences",
        (editor) => {
          if (!this.languageClient) return;
          findReferences(this.languageClient, editor);
        }
      )
    );

    this.mainDisposable.add(
      nova.commands.register(
        "raulchedrese.elixir-ls.installExpert",
        () => this.runInstallExpert()
      )
    );

    this.mainDisposable.add(
      nova.workspace.onDidAddTextEditor(
        handleAddTextEditor(this.mainDisposable, () => this.languageClient)
      )
    );

    const restart = () => this.start();
    this.mainDisposable.add(
      nova.config.onDidChange("elixir-ls.languageServer", restart)
    );
    this.mainDisposable.add(
      nova.config.onDidChange("elixir-ls.language-server-path", restart)
    );
    this.mainDisposable.add(
      nova.config.onDidChange("elixir-ls.expert-path", restart)
    );

    this.start();
  }

  deactivate() {
    this.stop();
    this.mainDisposable.dispose();
  }

  start() {
    this.stopClient();

    const serverKind = this.getServerKind();
    const client =
      serverKind === "expert" ? this.createExpertClient() : this.createElixirLSClient();

    if (!client) return;

    try {
      client.start();
      nova.subscriptions.add(client);
      this.languageClient = client;

      if (serverKind === "elixirLS") {
        // Expert uses a different configuration schema; only send ElixirLS settings to ElixirLS.
        sendDidChangeConfigurationNotification(client, nova.config);
      }
    } catch (err) {
      if (nova.inDevMode()) {
        console.error(err);
      }
    }
  }

  getServerKind(): ServerKind {
    const value = nova.config.get("elixir-ls.languageServer");
    return value === "expert" ? "expert" : "elixirLS";
  }

  createElixirLSClient(): LanguageClient {
    let path = String(nova.config.get("elixir-ls.language-server-path") || "");

    if (!path) {
      makeServerExecutable();
      path = nova.extension.path + "/elixir-ls-release/language_server.sh";
    }

    const workspacePath = nova.workspace.path;
    console.info("Using ElixirLS at %s (cwd: %s)", path, workspacePath || "/");

    return new LanguageClient(
      "elixir-ls-langserver",
      "Elixir Language Server",
      serverOptionsForCwd(path, [], workspacePath),
      { syntaxes: ["elixir"] }
    );
  }

  createExpertClient(): LanguageClient | null {
    const configuredPath = String(nova.config.get("elixir-ls.expert-path") || "");
    const path = findExpertBinary(configuredPath);

    if (!path) {
      this.promptInstallExpert(configuredPath);
      return null;
    }

    // Expert calls File.cwd!() at startup and creates a .expert/ dir there.
    // Nova spawns language servers with cwd "/", which fails with EROFS, so
    // Expert can't function without a real workspace path.
    const workspacePath = nova.workspace.path;
    if (!workspacePath) {
      console.warn("Expert requires an open workspace; no workspace path found.");
      nova.workspace.showWarningMessage(
        "Expert language server requires an open project folder."
      );
      return null;
    }

    console.info("Using Expert at %s (cwd: %s)", path, workspacePath);

    return new LanguageClient(
      "expert-langserver",
      "Expert Language Server",
      serverOptionsForCwd(path, ["--stdio"], workspacePath),
      { syntaxes: ["elixir"] }
    );
  }

  promptInstallExpert(configuredPath: string) {
    if (this.installing) return;

    const message = configuredPath.trim()
      ? `The configured Expert binary was not found at "${configuredPath}". Install Expert now?`
      : "Expert language server is selected but isn't installed. Install it now?";

    nova.workspace.showActionPanel(
      message,
      { buttons: ["Install Expert", "Set Path Manually", "Cancel"] },
      (buttonIndex) => {
        if (buttonIndex === 0) {
          this.runInstallExpert();
        } else if (buttonIndex === 1) {
          nova.openConfig();
        }
      }
    );
  }

  async runInstallExpert() {
    if (this.installing) return;
    this.installing = true;
    try {
      nova.workspace.showInformativeMessage("Installing Expert language server…");
      const installed = await installExpert();
      console.info("Expert installed at %s", installed);
      nova.workspace.showInformativeMessage(
        `Expert installed at ${installed}. Starting language server…`
      );
      // Make sure Expert is the selected server, then restart.
      if (this.getServerKind() !== "expert") {
        nova.config.set("elixir-ls.languageServer", "expert");
        // Setting the config will trigger restart via onDidChange.
      } else {
        this.start();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Expert install failed:", msg);
      nova.workspace.showErrorMessage(
        `Failed to install Expert: ${msg}\n\nYou can install it manually from https://github.com/expert-lsp/expert/releases and set the binary path in extension settings.`
      );
    } finally {
      this.installing = false;
    }
  }

  stop() {
    this.stopClient();
  }

  stopClient() {
    if (this.languageClient) {
      this.languageClient.stop();
      nova.subscriptions.remove(this.languageClient);
      this.languageClient = null;
    }
  }
}

