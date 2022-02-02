interface ElixirLS {
  dialyzerEnabled: boolean;
  dialyzerFormat: string;
  mixEnv: string;
  projectDir?: string;
}

export function sendDidChangeConfigurationNotification(client: LanguageClient, novaConfig: Configuration) {
  let elixirLS: ElixirLS = {
    dialyzerEnabled: Boolean(novaConfig.get("elixir-ls.dialyzerEnabled")),
    dialyzerFormat: "dialyzer",
    mixEnv: String(novaConfig.get("elixir-ls.mixEnv")),
  }
  
  const projectDir = novaConfig.get("elixir-ls.projectDir");
  
  if (projectDir) {
    elixirLS = {
      ...elixirLS,
      projectDir: String(projectDir)
    }
  }
  
  client.sendNotification("workspace/didChangeConfiguration", {
    settings: {
      elixirLS,
    }
  });
}
