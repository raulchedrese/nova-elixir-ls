export function sendDidCangeConfigurationNotification(client, novaConfig) {
  client.sendNotification("workspace/didChangeConfiguration", {
    settings: {
      elixirLS: {
        dialyzerEnabled: novaConfig.get("elixir-ls.dialyzerEnabled"),
        dialyzerFormat: novaConfig.get("elixir-ls.dialyzerFormat"),
        mixEnv: novaConfig.get("elixir-ls.mixEnv"),
      },
    },
  });
}
