// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");

module.exports = {
  mode: "production",
  entry: ["./src/index.ts"],
  output: {
    path: path.resolve(__dirname, "./bundle"),
    filename: "generator.js",
    clean: true,
    library: "BingoLibrary",
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
      },
    ],
  },
};
