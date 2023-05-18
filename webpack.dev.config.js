/* eslint-disable no-undef */

const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ReactRefreshPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const loaders = require("./webpack.loaders");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = process.env.PORT || "3000";

module.exports = {
  mode: "development",
  target: "web",
  entry: ["./src/index.jsx"],
  devtool: process.env.WEBPACK_DEVTOOL || "eval-source-map",
  output: {
    filename: "bundle.js",
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },
  module: {
    rules: [
      {
        test: /\.(j|t)sx?$/,
        include: /src/,
        loader: "babel-loader",
        options: {
          cacheDirectory: true,
          presets: [
            "@babel/preset-env",
            ["@babel/preset-react", { runtime: "automatic" }],
            "@babel/preset-typescript",
          ],
          plugins: ["react-refresh/babel"],
        },
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              importLoaders: 2,
              sourceMap: true,
            },
          },
          "postcss-loader",
          "sass-loader",
        ],
      },
      ...loaders,
    ],
  },
  stats: {
    children: true,
    errorDetails: true,
  },
  devServer: {
    compress: true,
    hot: true,
    liveReload: true,
    historyApiFallback: true, // serve index.html in place of 404 responses to allow HTML5 history
    port: PORT,
    host: HOST,
    allowedHosts: "auto",
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
    },
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
    open: [`http://localhost:${PORT}`],
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: '"development"',
      },
    }),
    new webpack.NoEmitOnErrorsPlugin(),
    new ReactRefreshPlugin(),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      inject: "body",
    }),
  ],
};
