# Elixir Language Server for Nova

This extension adds advanced support for Elixir features. It is powered by elixir-ls. It is currently experimental. Please report any issues you run into.

## Supported Features:

- Go-to-definition (working)
- Reporting of build warnings and errors (working)
- Documentation lookup on hover (working)
- Dialyzer analysis (working)
- Code completion (working)
- Format code on save (experimental)
- Find references (experimental)

## Contributions

Help improving this extension.

To do this, you need to execute the following commands.

```shell
pwd # should look like /somewhere/on/your/drive/in/nova-elixir-ls
# install necessary project dependencies
yarn install # npm install

# compile elixir-ls
cd elixir-ls
mix deps.get
mix compile
mix elixir_ls.release -o ../ElixirLS.novaextension/elixir-ls-release
cd ...

# bundle nova extension
yarn build # npm run build
```

Finally, you have to activate this extension. To do this, click on 'Activate Project as Extension' in the menu 'Extensions'.

## Acknowledgements

Syntax highlighting and language completions are included from https://github.com/stollcri/elixir.novaextension with permission from the maintainer.

This project is heavily inspired by https://github.com/apexskier/nova-typescript
