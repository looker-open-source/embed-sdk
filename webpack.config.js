module.exports = {
  mode: 'production',
  resolve: {
    extensions: ['.js','.ts']
  },
  output: {
    library: 'LookerEmbedSDK',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader',
          }
        ],
        exclude: [
          /node_modules/
        ]
      },
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: 'ts-loader',
            options: {
            }
          }
        ]
      }
    ]
  }
}
