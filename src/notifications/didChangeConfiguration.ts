export function sendDidChangeConfigurationNotification(client: LanguageClient, novaConfig: Configuration) {
  client.sendNotification("workspace/didChangeConfiguration", {
    settings: {
      elixirLS: {
        dialyzerEnabled: novaConfig.get("elixir-ls.dialyzerEnabled"),
        dialyzerFormat: "dialyzer",
        mixEnv: novaConfig.get("elixir-ls.mixEnv"),
        projectDir: novaConfig.get("elixir-ls.projectDir") || null
      },
    },
  });
}
