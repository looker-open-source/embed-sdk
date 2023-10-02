var path = require('path')
var config = require('./config')
const webpack = require('webpack')

var users = require('./demo/demo_users.json')
var { addRoutes } = require('./server/routes')

var webpackConfig = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    demo: './demo/demo.ts',
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
      LOOKER_LOOK_ID: null,
      LOOKER_EXPLORE_ID: null,
      LOOKER_EXTENSION_ID: null,
      LOOKER_COOKIELESS_ENABLED: null,
      LOOKER_USE_EMBED_DOMAIN: null,
    }),
  ],
  devServer: {
    compress: true,
    contentBase: [path.join(__dirname, 'demo')],
    host: config.demo_host,
    port: config.demo_port,
    watchContentBase: true,
    before: (app) => {
      addRoutes(app, config, users)
    },
  },
}

module.exports = webpackConfig
