# Elixir for Nova

Editor support for Elixir in Nova. This extension adds syntax highlighting for Elixir along with language server support.

## Language Server

The extension can run against either of two language servers, selected in the extension settings under **Language Server**.

### ElixirLS (default)

Bundled with the extension — nothing to install.

### Expert (experimental)

This extension has experimental support for the new [expert-lsp/expert](https://github.com/expert-lsp/expert) language server.

To use it:

1. Set **Language Server** to **Expert**.
2. Either run the **Install Expert Language Server** command from the Extensions menu to download the matching binary automatically, or set **Expert Binary Path** to a binary you've installed yourself (e.g. via the releases page or your package manager).

When the Expert path is left empty, the extension auto-detects an `expert` (or `start_expert`) executable in common locations including `~/.local/bin`, `/opt/homebrew/bin`, `/usr/local/bin`, and its own managed install directory.

## Issues

This extension is still under active development. Please report problems at the [issue tracker](https://github.com/raulchedrese/nova-elixir-ls/issues).
