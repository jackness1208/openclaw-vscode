const path = require("path");
const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");

const codiconsCssPath = path.resolve(__dirname, '..', 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.css');
const codiconsFontPath = path.resolve(__dirname, '..', 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.ttf');

module.exports = {
  entry: {
    chatPanel: "./src/chat-view/index.tsx"
  },
  output: {
    path: path.resolve(__dirname, "../openclaw-vscode-extension/pack"),
    filename: "[name].js"
  },
  devtool: "inline-source-map",
  resolve: {
    extensions: [".js", ".ts", ".tsx", ".json"],
    alias: {
      // vscode-messenger-webview's vscode-api.js is empty at runtime;
      // this shim provides the global acquireVsCodeApi() from VS Code webview
      "vscode-messenger-webview/lib/vscode-api": path.resolve(__dirname, "src/shims/vscode-api.ts")
    },
    fallback: {
      "fs": false,
      "path": false,
      "os": false,
      "crypto": false
    }
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
            options: {
              compilerOptions: {
                module: "es6"
              }
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: "style-loader"
          },
          {
            loader: "css-loader"
          }
        ]
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: "svg-url-loader",
            options: {
              limit: 10000
            }
          }
        ]
      }
    ]
  },
  performance: {
    hints: false
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV || "development")
      }
    }),
    new CopyPlugin({
      patterns: [
        { from: codiconsCssPath, to: "./codicons" },
        { from: codiconsFontPath, to: "./codicons" }
      ],
    }),
  ],
  watchOptions: {
    aggregateTimeout: 2000,
    ignored: /node_modules/,
  },
};