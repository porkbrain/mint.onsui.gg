/* eslint-disable no-undef */

module.exports = [
  {
    test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/i,
    type: "asset",
    generator: {
      filename: "./fonts/[name].[contenthash:8][ext]",
    },
  },
  {
    test: /\.(png|jpe?g|gif|webp|ico|svg)(\?.*)?$/,
    type: "asset",
    generator: {
      filename: "./images/[name].[contenthash:8][ext]",
    },
  },
];
