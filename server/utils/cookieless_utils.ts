/*

 MIT License

 Copyright (c) 2019 Looker Data Sciences, Inc.

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

import { Looker40SDK } from '@looker/sdk'
import { NodeSession } from '@looker/sdk-node'
import type { IApiSection } from '@looker/sdk-rtl'
import { DefaultSettings } from '@looker/sdk-rtl'
import type { Response } from 'express'
import type { ApplicationConfig, LookerEmbedUser } from '../types'

/**
 * The functions in this file demonstrate how to call server
 * side functions for cookieless embed. Please note that the
 * implementation is exceedingly simplistic and only works for
 * a single user in a development environment.
 */

// Application configuration
let config: ApplicationConfig

// Set the configuration
export const setConfig = (conf: ApplicationConfig) => (config = conf)

// The Looker session
let lookerSession: NodeSession

/**
 * Create a Looker session using the Looker SDK. This session can be
 * be shared amongst all embed users. If data is required for the embed
 * user, this session can be used to create a session for the embed user,
 * something like the following but not required for this demo.
 * ```js
 * const sdk = new Looker40SDK(session)
 * const embedUser = await sdk.ok(
 *   sdk.user_for_credential('embed', embedUserId),
 * )
 * const auth = sdk.authSession as IAuthSession
 * await auth.login(embedUser.id!)
 * ```
 */
const acquireLookerSession = async () => {
  if (!lookerSession || !lookerSession.activeToken.isActive()) {
    const { api_url, client_id, client_secret, verify_ssl } = config
    try {
      const lookerSettings = DefaultSettings()
      lookerSettings.readConfig = (): IApiSection => {
        return {
          client_id,
          client_secret,
        }
      }
      lookerSettings.base_url = api_url
      lookerSettings.verify_ssl = verify_ssl
      lookerSession = new NodeSession(lookerSettings)
      await lookerSession.login()
    } catch (error) {
      console.error('login failed', { error })
      throw error
    }
  }
}

/**
 * Acquire the cookieless embed session. If the session already exists,
 * this call will join it. Use this call to get an authorization token
 * to get create a new IFRAME.
 */
const acquireEmbedSessionInternal = async (
  userAgent: string,
  user: LookerEmbedUser,
  session_reference_token?: string
) => {
  try {
    const request = {
      ...user,
      session_reference_token: session_reference_token,
    }
    const sdk = new Looker40SDK(lookerSession)
    const response = await sdk.ok(
      sdk.acquire_embed_cookieless_session(request, {
        headers: {
          'User-Agent': userAgent,
        },
      })
    )
    return response
  } catch (error) {
    console.error('embed session acquire failed', { error })
    throw error
  }
}

/**
 * Acquire the cookieless embed session. If the session already exists,
 * this call will join it. Use this call to get an authorization token
 * to get create a new IFRAME.
 *
 * The Looker Embed SDK requires a callback that will ultimately
 * require that something similar to the following be called.
 */
export async function acquireEmbedSession(
  userAgent: string,
  user: LookerEmbedUser,
  session_reference_token: string
) {
  await acquireLookerSession()
  return acquireEmbedSessionInternal(userAgent, user, session_reference_token)
}

/**
 * Generate embed navigation and api tokens for the embed session.
 *
 * The Looker Embed SDK requires a callback that will ultimately
 * require that something similar to the following be called.
 */
export async function generateEmbedTokens(
  userAgent: string,
  session_reference_token: string,
  api_token: string,
  navigation_token: string
) {
  if (!session_reference_token) {
    console.error('embed session generate tokens failed')
    // missing session reference  treat as expired session
    return {
      session_reference_token_ttl: 0,
    }
  }
  await acquireLookerSession()
  try {
    const sdk = new Looker40SDK(lookerSession)
    const response = await sdk.ok(
      sdk.generate_tokens_for_cookieless_session(
        {
          api_token,
          navigation_token,
          session_reference_token: session_reference_token || '',
        },
        {
          headers: {
            'User-Agent': userAgent,
          },
        }
      )
    )
    return {
      api_token: response.api_token,
      api_token_ttl: response.api_token_ttl,
      navigation_token: response.navigation_token,
      navigation_token_ttl: response.navigation_token_ttl,
      session_reference_token_ttl: response.session_reference_token_ttl,
    }
  } catch (error: any) {
    if (error.message?.includes('Invalid input tokens provided')) {
      // Currently the Looker UI does not know how to handle bad
      // tokens. This should not happen but if it does expire the
      // session. If the token is bad there is not much that that
      // the Looker UI can do.
      return {
        session_reference_token_ttl: 0,
      }
    }
    console.error('embed session generate tokens failed', { error })
    throw error
  }
}

export function isValidAuthConfig(res: Response) {
  if (!config.host || !config.secret) {
    console.error(
      'Config does not have the neccassary host or secret to generate an embedded url. Config:',
      config
    )
    return res.status(400).send({
      message: 'Invalid Configuration',
    })
  }
  return true
}
