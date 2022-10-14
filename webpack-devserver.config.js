var path = require('path')
var config = require('./config')
const webpack = require('webpack')

var user = require('./demo/demo_user.json')
var { createSignedUrl } = require('./server_utils/auth_utils')
var {
  acquireEmbedSession,
  generateEmbedTokens,
  setConfig,
} = require('./server_utils/cookieless_utils')

setConfig(config)

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
    new webpack.EnvironmentPlugin([
      'LOOKER_EMBED_HOST',
      'LOOKER_DASHBOARD_ID',
      'LOOKER_LOOK_ID',
      'LOOKER_EXPLORE_ID',
      'LOOKER_EXTENSION_ID',
    ]),
  ],
  devServer: {
    compress: true,
    contentBase: [path.join(__dirname, 'demo')],
    host: config.demo_host,
    port: config.demo_port,
    watchContentBase: true,
    before: (app) => {
      app.get('/auth', function (req, res) {
        // Authenticate the request is from a valid user here
        const src = req.query.src
        const url = createSignedUrl(src, user, config.host, config.secret)
        res.json({ url })
      })
      app.get('/acquire-embed-session', async function (req, res) {
        try {
          const tokens = await acquireEmbedSession(
            req.headers['user-agent'],
            user
          )
          res.json(tokens)
        } catch (err) {
          res.status(400).send({ message: err.message })
        }
      })
      app.get('/generate-embed-tokens', async function (req, res) {
        try {
          const tokens = await generateEmbedTokens(
            req.headers['user-agent'],
            user
          )
          res.json(tokens)
        } catch (err) {
          res.status(400).send({ message: err.message })
        }
      })
    },
  },
}

module.exports = webpackConfig
