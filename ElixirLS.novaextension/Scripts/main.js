
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

        // Use the default server path
        if (!path) {
            path = nova.extension.path + '/elixir-ls-release/language_server.sh';
        }

        // Create the client
        var serverOptions = {
            path: path
        };
        var clientOptions = {
            // The set of document syntaxes for which the server is valid
            syntaxes: ['elixir']
        };
        var client = new LanguageClient('elixir-ls-langserver', 'Elixir Language Server', serverOptions, clientOptions);

        try {
            // Start the client
            client.start();

            // Add the client to the subscriptions to be cleaned up
            nova.subscriptions.add(client);
            this.languageClient = client;
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
            this.languageClient = null;
        }
    }
}

