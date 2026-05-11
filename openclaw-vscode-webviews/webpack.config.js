const path = require("path");
const webpack = require("webpack");

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
    fallback: {
      "fs": false,
      "path": false,
      "os": false
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
    })
  ],
  watchOptions: {
    aggregateTimeout: 2000,
    ignored: /node_modules/,
  },
};