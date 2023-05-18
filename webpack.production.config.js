/* eslint-disable no-undef */

const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const CopyPlugin = require("copy-webpack-plugin");
const loaders = require("./webpack.loaders");

const WEBPACK_REPORT = true;

module.exports = {
  mode: "production",
  entry: ["./src/index.jsx"],
  devtool: process.env.WEBPACK_DEVTOOL || "source-map",
  output: {
    clean: true,
    publicPath: "./",
    path: path.join(__dirname, "dist"),
    filename: "js/[contenthash].js",
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
          presets: [
            "@babel/preset-env",
            ["@babel/preset-react", { runtime: "automatic" }],
            "@babel/preset-typescript",
          ],
        },
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              importLoaders: 2,
              sourceMap: false,
            },
          },
          "postcss-loader",
          "sass-loader",
        ],
      },
      ...loaders,
    ],
  },
  optimization: {
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
          output: {
            comments: false,
          },
          warnings: false,
        },
      }),
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: '"production"',
      },
    }),
    new MiniCssExtractPlugin({
      filename: "css/[contenthash].css",
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.join(__dirname, "public"),
          to: path.join(__dirname, "dist"),
          toType: "dir",
          globOptions: {
            ignore: ["**/index.html"],
            dot: true,
          },
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      inject: "body",
    }),
  ],
};

if (WEBPACK_REPORT) {
  module.exports.plugins.push(
    new BundleAnalyzerPlugin({
      analyzerMode: "static",
      generateStatsFile: true,
      openAnalyzer: false,
      reportFilename: path.join(__dirname, "webpack-report/index.html"),
      statsFilename: path.join(__dirname, "webpack-report/stats.json"),
    })
  );
}
