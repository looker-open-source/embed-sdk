var path = require('path')
var config = require('./config')
const webpack = require('webpack')
const express = require('express')

var user = require('./demo/demo_user.json')
var { addRoutes } = require('./server/routes')

var webpackConfig = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    demo_single_frame: './demo/demo_single_frame.ts',
    demo_multi_frame: './demo/demo_multi_frame.ts',
    message_example: './demo/message_example.ts',
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'demo'),
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      config: path.join(__dirname, './config.js'),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          compilerOptions: {
            declaration: false,
          },
        },
      },
    ],
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      LOOKER_WEB_URL: null,
      LOOKER_EMBED_HOST: null, // deprecated - use LOOKER_WEB_URL instead
      LOOKER_DASHBOARD_ID: null,
      LOOKER_DASHBOARD_ID_2: null,
      LOOKER_LOOK_ID: null,
      LOOKER_EXPLORE_ID: null,
      LOOKER_EXTENSION_ID: null,
      LOOKER_QUERY_VISUALIZATION_ID: null,
      LOOKER_REPORT_ID: null,
      LOOKER_USE_EMBED_DOMAIN: null,
      LOOKER_EMBED_TYPE: null,
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'demo'),
    },
    compress: true,
    host: config.demo_host,
    port: config.demo_port,
    app: () => {
      const app = express()
      addRoutes(app, config, user)
      return app
    },
  },
}

module.exports = webpackConfig
