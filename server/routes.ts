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

import type { Express, Request, Response } from 'express'
import cookieParser from 'cookie-parser'
import cookieEncrypter from 'cookie-encrypter'
import type { IEmbedCookielessSessionAcquireResponse } from '@looker/sdk'
import { createSignedUrl } from './utils/auth_utils'
import {
  acquireEmbedSession,
  generateEmbedTokens,
  setConfig,
} from './utils/cookieless_utils'
import type { ApplicationConfig, LookerEmbedUser } from './types'

/**
 * Extract the embed session data from a secure encrypted cookie.
 */
const getEmbedSession = (req: Request) => {
  let embedSession: IEmbedCookielessSessionAcquireResponse | undefined
  if (req.signedCookies.embed_session) {
    try {
      embedSession = JSON.parse(req.signedCookies.embed_session)
    } catch (error) {
      console.error('failed to parse embed_session cookie', error)
      // noop
    }
  }
  return embedSession
}

/**
 * Generates the embed session cookie. Note that max age reflects the
 * embed sessions time to live.
 */
const generateCookie = (
  res: Response,
  embedSession: IEmbedCookielessSessionAcquireResponse
) => {
  const { session_reference_token_ttl } = embedSession
  if (session_reference_token_ttl && session_reference_token_ttl > 0) {
    res.cookie('embed_session', JSON.stringify(embedSession), {
      expires: new Date(Date.now() + session_reference_token_ttl * 1000),
      httpOnly: true,
      maxAge: session_reference_token_ttl * 1000,
      // secure false is development only - for production this should be true
      secure: false,
      signed: true,
    })
  } else if (session_reference_token_ttl === 0) {
    res.cookie('embed_session', '', {
      expires: new Date(),
      httpOnly: true,
      maxAge: 0,
      // secure false is development only - for production this should be true
      secure: false,
      signed: true,
    })
  }
}

/**
 * Add embed routes to an express application
 */
export const addRoutes = (
  app: Express,
  config: ApplicationConfig,
  user: LookerEmbedUser
) => {
  setConfig(config)

  app.use(cookieParser(config.cookie_secret))
  app.use(cookieEncrypter(config.cookie_secret))

  app.get('/auth', function (req: Request, res: Response) {
    // Authenticate the request is from a valid user here
    const src = req.query.src as string
    const url = createSignedUrl(src, user, config.host, config.secret)
    res.json({ url })
  })
  app.get(
    '/acquire-embed-session',
    async function (req: Request, res: Response) {
      try {
        const response = await acquireEmbedSession(
          req.headers['user-agent']!,
          user,
          getEmbedSession(req)
        )
        const {
          authentication_token,
          authentication_token_ttl,
          navigation_token,
          navigation_token_ttl,
          session_reference_token_ttl,
          api_token,
          api_token_ttl,
        } = response
        generateCookie(res, response)
        res.json({
          api_token,
          api_token_ttl,
          authentication_token,
          authentication_token_ttl,
          navigation_token,
          navigation_token_ttl,
          session_reference_token_ttl,
        })
      } catch (err: any) {
        res.status(400).send({ message: err.message })
      }
    }
  )

  app.get(
    '/generate-embed-tokens',
    async function (req: Request, res: Response) {
      try {
        const embedSession = getEmbedSession(req)
        const tokens = await generateEmbedTokens(
          req.headers['user-agent']!,
          embedSession
        )
        // It is important to keep track of recent api and
        // navigation tokens.
        generateCookie(res, { ...embedSession, ...tokens })
        res.json(tokens)
      } catch (err: any) {
        res.status(400).send({ message: err.message })
      }
    }
  )
}
