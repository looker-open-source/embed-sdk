/*

 MIT License

 Copyright (c) 2022 Looker Data Sciences, Inc.

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

 */

import https from 'https'
import fs from 'fs'
import path from 'path'
import express from 'express'
// eslint-disable-next-line import/no-extraneous-dependencies
import history from 'connect-history-api-fallback'
import { addRoutes } from './routes'
import { config } from './config'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const user = require('../demo/demo_user.json')

const app = express()

addRoutes(app, config, user)

app.use(history())
app.use('/', express.static('public'))

const port = config.demo_port

if (config.demo_protocol !== 'https') {
  app.listen(port, () => {
    console.info(`Listening on http://localhost:${port}`)
  })
} else {
  const key = fs.readFileSync(path.join(__dirname, '/key.pem'))
  const cert = fs.readFileSync(path.join(__dirname, '/cert.pem'))
  const options = {
    cert: cert,
    key: key,
  }
  const server = https.createServer(options, app)
  server.listen(port, () => {
    console.info(`Listening on https://localhost:${port}`)
  })
}
