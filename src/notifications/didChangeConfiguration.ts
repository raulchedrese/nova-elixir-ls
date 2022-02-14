interface ElixirLS {
  dialyzerEnabled: boolean
  dialyzerFormat: string
  mixEnv: string
  projectDir?: string
}

export function sendDidChangeConfigurationNotification(
  client: LanguageClient,
  novaConfig: Configuration
) {
  const elixirLS: ElixirLS = {
    dialyzerEnabled: Boolean(novaConfig.get("elixir-ls.dialyzerEnabled")),
    dialyzerFormat: "dialyzer",
    mixEnv: String(novaConfig.get("elixir-ls.mixEnv")),
    projectDir: String(novaConfig.get("elixir-ls.projectDir")),
  }

  client.sendNotification("workspace/didChangeConfiguration", {
    settings: {
      elixirLS,
    },
  })
}
