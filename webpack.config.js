const path = require('path');

const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const StyleExtHtmlWebpackPlugin = require('style-ext-html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const cssLoader = require('css-loader');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin')


module.exports = {
  //mode: "production",
  mode: "development",
  module:{
  },
  output: {
    path: path.resolve("./dist/"),
    filename: "tth.js"
  },

  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.png$/i,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10240,
            }
          }
        ],
      },
    ]
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      test: /\.js(\?.*)?$/i,
      terserOptions:{
        mangle: true,
        keep_classnames: false,
        keep_fnames: false,
      }
    })],
  },
  plugins: [
    new TerserPlugin({
      test: /\.js(\?.*)?$/i,
      terserOptions: {
        mangle: true,
        keep_classnames: false,
        keep_fnames: false
      }
    }), 
    new MiniCssExtractPlugin(),
    new HtmlWebpackPlugin({
      inlineSource: '.(js|css)$', // embed all javascript and css inline
      entry: 'dist/tth.js',
      filename: './tth.html',
      template: './index-template.html'
    }),
    new HtmlWebpackInlineSourcePlugin(),
  ]  
};
