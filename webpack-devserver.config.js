var fs = require('fs')
var path = require('path')
var config = require('./config')
const webpack = require('webpack')
const express = require('express')

var user = require('./demo/demo_user.json')
if (process.env.LOOKER_SESSION_LENGTH) {
  const sessionLength = parseInt(process.env.LOOKER_SESSION_LENGTH, 10)
  if (!isNaN(sessionLength)) {
    user.session_length = sessionLength
  }
}
if (process.env.LOOKER_SESSION_LOCALE) {
  if (process.env.LOOKER_SESSION_LOCALE === '-') {
    if (user.user_attributes) {
      delete user.user_attributes.locale
    }
  } else {
    user.user_attributes = user.user_attributes || {}
    user.user_attributes.locale = process.env.LOOKER_SESSION_LOCALE
  }
}
var { addRoutes } = require('./server/routes')

var webpackConfig = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    demo_single_frame: './demo/demo_single_frame.ts',
    demo_multi_frame: './demo/demo_multi_frame.ts',
    demo_merge_edit_frame: './demo/demo_merge_edit_frame.ts',
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
      LOOKER_MERGE_QUERY_ID: null,
      LOOKER_EXTENSION_ID: null,
      LOOKER_QUERY_VISUALIZATION_ID: null,
      LOOKER_REPORT_ID: null,
      LOOKER_USE_EMBED_DOMAIN: null,
      LOOKER_EMBED_TYPE: null,
      LOOKER_DEMO_PROXY_PATH: null,
      LOOKER_DEMO_HOST_EXTERNAL: null,
      LOOKER_THEME: null,
      LOOKER_CUSTOM_THEME: null,
      LOOKER_SESSION_LENGTH: null,
      LOOKER_SESSION_LOCALE: null,
    }),
  ],
  devServer: {
    historyApiFallback: {
      rewrites: [{ from: /merge_edit/, to: '/demo_merge_edit_frame.html' }],
    },
    static: {
      directory: path.join(__dirname, 'demo'),
    },
    compress: true,
    host:
      process.env.LOOKER_DEMO_HOST_EXTERNAL === 'true'
        ? '0.0.0.0'
        : config.demo_host,
    port: config.demo_port,
    server:
      config.demo_protocol !== 'https'
        ? 'http'
        : {
            type: 'https',
          },
    allowedHosts: 'all',
    app: () => {
      const app = express()
      addRoutes(app, config, user)
      return app
    },
  },
}

module.exports = webpackConfig
