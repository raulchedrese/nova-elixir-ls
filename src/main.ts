import { findReferences } from "./commands/findReferences";
import handleAddTextEditor from "./handlers/handleAddTextEditor";
import { makeServerExecutable } from "./novaUtils";

var langserver = null;

exports.activate = function() {
    // Do work when the extension is activated
    langserver = new ElixirLanguageServer();
}

exports.deactivate = function() {
    // Clean up state before the extension is deactivated
    if (langserver) {
        langserver.deactivate();
        langserver = null;
    }
}


class ElixirLanguageServer {
  languageClient: LanguageClient;
  mainDisposable: CompositeDisposable;
  
    constructor() {
        // Observe the configuration setting for the server's location, and restart the server on change
        
        nova.config.observe('elixir-ls.language-server-path', function(path) {
            this.start(path);
        }, this);
    }
    
    deactivate() {
        this.stop();
    }
    
    start(path) {
        if (this.languageClient) {
            this.languageClient.stop();
            nova.subscriptions.remove(this.languageClient);
        }

        makeServerExecutable();

        // Use the default server path
        if (!path) {
            path = nova.extension.path + "/elixir-ls-release/language_server.sh";
        }
        
        // Create the client
        var serverOptions = {
            path: path
        };
        var clientOptions = {            // The set of document syntaxes for which the server is valid
            syntaxes: ["elixir"]
        };
        const client: any = new LanguageClient(
          "elixir-ls-langserver",
          "Elixir Language Server",
          serverOptions,
          clientOptions
        );

        this.mainDisposable = new CompositeDisposable();
        try {
            // Start the client
            client.start();
            
            client.sendNotification("workspace/didChangeConfiguration", {
              settings: {
                elixirLS: {
                  dialyzerEnabled: nova.config.get("elixir-ls.dialyzerEnabled"),
                  dialyzerFormat: nova.config.get("elixir-ls.dialyzerFormat"),
                  mixEnv: nova.config.get("elixir-ls.mixEnv"),
                },
              },
            });
            
            // Add the client to the subscriptions to be cleaned up
            nova.subscriptions.add(client); 
            this.languageClient = client;
            
            // Find References
            nova.commands.register(
              "raulchedrese.elixir-ls.findReferences",
              (editor) => {
                findReferences(client, editor);
              }
            );
            
            // Format on Save
            nova.workspace.onDidAddTextEditor(
              handleAddTextEditor(this.mainDisposable, client, nova.config.get("elixir-ls.formatOnSave"))
            )
        }
        catch (err) {
            // If the .start() method throws, it's likely because the path to the language server is invalid
            
            if (nova.inDevMode()) {
                console.error(err);
            }
        }
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

