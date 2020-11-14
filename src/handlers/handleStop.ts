export default () => (err) => {
  let message =
    "Elixir Language Server stopped unexpectedly.\n Please report this error.";

  message += `\n\n ${err}`;

  nova.workspace.showActionPanel(
    message,
    {
      buttons: ["Restart", "Ignore"],
    },
    (index) => {
      if (index == 0) {
        nova.commands.invoke("raulchedrese.elixir-ls.restart");
      }
    }
  );
};
