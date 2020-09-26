import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";

export default {
  input: "src/main.ts",
  plugins: [typescript(), resolve()],
  output: {
    file: "elixirLS.novaextension/Scripts/main.js",
    sourcemap: true,
    format: "cjs",
  },
};
