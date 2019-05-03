var path = require('path')
var config = require ('./config')
var user = require('./demo/demo_user.json')
var { createSignedUrl } = require('./server_utils/auth_utils')

var webpackConfig = {
  mode: 'development',
  entry: {
    demo: './demo/demo.ts'
  },
  output: {
    filename: "[name].js",
    path: path.join(__dirname, "demo", "build")
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      config: path.join(__dirname, './config.js'),
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader"
      }
    ]
  },
  devServer: {
    compress: true,
    contentBase: [
      path.join(__dirname, "demo"),
      path.join(__dirname, "demo", "build")
    ],
    watchContentBase: true,
    before: (app) => {
      app.get('/auth', function(req, res) {
        // Authenticate the request is from a valid user here
        const src = req.query.src;
        const url = createSignedUrl(src, user, config.host, config.secret);
        res.json({ url });
      });
    }
  }
}

module.exports = webpackConfig
