# Elixir Language Server for Nova

This extension adds advanced support for Elixir features. It is powered by elixir-ls. It is currently experimental. Please report any issues you run into.

## Supported Features

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

# bundle nova extension
yarn build # npm run build
```

Finally, you have to activate this extension. To do this, in Preferences -> General -> activate 'Show extension development items in the Extensions menu', and then click on 'Activate Project as Extension' in the menu 'Extensions'.
