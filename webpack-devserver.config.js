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
    demo: './demo/demo.ts',
    demo_v1: './demo/demo_v1.ts',
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
      LOOKER_EMBED_HOST: null,
      LOOKER_DASHBOARD_ID: null,
      LOOKER_DASHBOARD_ID_2: null,
      LOOKER_LOOK_ID: null,
      LOOKER_EXPLORE_ID: null,
      LOOKER_EXTENSION_ID: null,
      LOOKER_COOKIELESS_ENABLED: null,
      LOOKER_USE_EMBED_DOMAIN: null,
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
