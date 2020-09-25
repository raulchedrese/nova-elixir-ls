
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

function rangeToLspRange(document, range) {
  const fullContents = document.getTextInRange(new Range(0, document.length));
  let chars = 0;
  let startLspRange;
  const lines = fullContents.split(document.eol);
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const lineLength = lines[lineIndex].length + document.eol.length;
    if (!startLspRange && chars + lineLength >= range.start) {
      const character = range.start - chars;
      startLspRange = { line: lineIndex, character };
    }
    if (startLspRange && chars + lineLength >= range.end) {
      const character = range.end - chars;
      return { line: lineIndex, character: character };
    }
    chars += lineLength;
  }
  return null;
}

function lspRangeToRange(document, range) {
  const fullContents = document.getTextInRange(new Range(0, document.length));
  let rangeStart = 0;
  let rangeEnd = 0;
  let chars = 0;
  const lines = fullContents.split(document.eol);
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const lineLength = lines[lineIndex].length + document.eol.length;
    if (range.start.line === lineIndex) {
      rangeStart = chars + range.start.character;
    }
    if (range.end.line === lineIndex) {
      rangeEnd = chars + range.end.character;
      break;
    }
    chars += lineLength;
  }
  return new Range(rangeStart, rangeEnd);
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


            // Format on Save
            nova.workspace.onDidAddTextEditor(editor => {
              editor.onWillSave((editor) => {
                client.sendRequest('textDocument/formatting', {
                  textDocument: { uri: editor.document.uri },
                  options: {}
                }).then(result => {
                  editor.edit((edit) => {
                    result.map((r) => {
                      edit.replace(lspRangeToRange(editor.document, r.range), r.newText);
                    })
                  });

                });
              })
            })

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

