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

import type { Express, NextFunction, Request, Response } from 'express'
import cookieSession from 'cookie-session'
import bodyParser from 'body-parser'
import { createSignedUrl } from './utils/auth_utils'
import {
  acquireEmbedSession,
  generateEmbedTokens,
  setConfig,
  isValidAuthConfig,
} from './utils/cookieless_utils'
import type { ApplicationConfig, LookerEmbedUser } from './types'

interface ClientSession {
  user_index: number
  external_user_id: string
  session_reference_token?: string
  client_session_id?: string
}

interface SessionData {
  clientSessions: ClientSession[]
}

/**
 * Add embed routes to an express application
 */
export const addRoutes = (
  app: Express,
  config: ApplicationConfig,
  users: LookerEmbedUser[]
) => {
  setConfig(config)

  app.use(bodyParser.json())

  app.use(
    cookieSession({
      maxAge: users[0].session_length * 1000,
      name: 'embed_session',
      secret: config.cookie_secret,
    })
  )

  app.use(function (req: Request, res: Response, next: NextFunction) {
    if (!req.session) {
      res.status(400).send({ message: 'session cookie data missing' })
      return
    }
    const { clientId } = req.query
    const clientSessions: ClientSession[] = req.session.client_sessions
    if (!clientSessions) {
      req.session.client_sessions = []
      res.locals.current_session = {}
    } else {
      if (clientId) {
        res.locals.current_session = clientSessions.find(
          (clientSession) => clientSession.client_session_id === clientId
        )
      } else {
        res.locals.current_session = clientSessions.find(
          (clientSession) =>
            clientSession.external_user_id === users[0].external_user_id
        )
      }
    }
    let userId = req.query.userId || users[0].external_user_id
    if (!users.find((user) => user.external_user_id === userId)) {
      userId = users[0].external_user_id
    }
    if (
      !res.locals.current_session ||
      res.locals.current_session.external_user_id !== userId
    ) {
      res.locals.current_session = {
        client_session_id: clientId,
        external_user_id: userId,
      }
    }
    next()
  })

  app.get('/auth', function (req: Request, res: Response) {
    // Authenticate the request is from a valid user here
    const src = req.query.src as string
    const configValid = isValidAuthConfig(res)

    if (configValid !== true) return

    const url = createSignedUrl(src, users[0], config.host, config.secret)
    res.json({ url })
  })

  app.get(
    '/acquire-embed-session',
    async function (req: Request, res: Response) {
      try {
        const { current_session_reference_token, external_user_id } =
          res.locals.current_session
        const user =
          users.find((user) => user.external_user_id === external_user_id) ||
          users[0]
        const response = await acquireEmbedSession(
          req.headers['user-agent']!,
          user,
          current_session_reference_token
        )
        const {
          authentication_token,
          authentication_token_ttl,
          navigation_token,
          navigation_token_ttl,
          session_reference_token,
          session_reference_token_ttl,
          api_token,
          api_token_ttl,
        } = response
        if (
          req.session &&
          current_session_reference_token !== session_reference_token
        ) {
          res.locals.current_session.session_reference_token =
            session_reference_token
          const clientSessions: ClientSession[] = req.session.client_sessions
          const clientSessionIndex = clientSessions.findIndex(
            (session) =>
              session.client_session_id ===
              res.locals.current_session.client_session_id
          )
          if (clientSessionIndex < 0) {
            req.session.client_sessions.push(res.locals.current_session)
          } else {
            req.session.client_sessions[
              clientSessionIndex
            ].session_reference_token = session_reference_token
          }
        }
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

  app.put(
    '/generate-embed-tokens',
    async function (req: Request, res: Response) {
      if (!req.session) {
        res.status(400).send({ message: 'session cookie data missing' })
        return
      }
      if (!res.locals.current_session) {
        res.status(400).send({ message: 'current session data not found' })
        return
      }
      try {
        const session_reference_token =
          res.locals.current_session.session_reference_token
        const { api_token, navigation_token } = req.body as any
        const tokens = await generateEmbedTokens(
          req.headers['user-agent']!,
          session_reference_token,
          api_token,
          navigation_token
        )
        res.json(tokens)
      } catch (err: any) {
        res.status(400).send({ message: err.message })
      }
    }
  )
}
