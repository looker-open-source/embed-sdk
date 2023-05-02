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

import dotenv from 'dotenv'
import type { ApplicationConfig } from './types'

dotenv.config({ path: '../.env' })

export const config: ApplicationConfig = {
  api_url:
    process.env.LOOKER_EMBED_API_URL || 'https://self-signed.looker.com:19999',
  client_id: process.env.LOOKER_CLIENT_ID!,
  client_secret: process.env.LOOKER_CLIENT_SECRET!,
  cookie_secret: (process.env.COOKIE_SECRET || 'secret').padEnd(
    32,
    'ABCDEFGHIJKLMNOPQRSTUVWZYZ0123456'
  ),
  demo_host: process.env.LOOKER_DEMO_HOST || 'localhost',
  demo_port: parseInt(process.env.LOOKER_DEMO_PORT || '8080', 10),
  host: process.env.LOOKER_EMBED_HOST || 'self-signed.looker.com:9999',
  secret: process.env.LOOKER_EMBED_SECRET!,
  use_embed_domain: process.env.LOOKER_USE_EMBED_DOMAIN === 'true' || false,
  verify_ssl: process.env.LOOKER_VERIFY_SSL === 'true' || false,
}
