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

import type { IEmbedCookielessSessionAcquireResponse } from '@looker/sdk'
import { Looker40SDK } from '@looker/sdk'
import { NodeSession } from '@looker/sdk-node'
import type { IApiSection } from '@looker/sdk-rtl'
import { DefaultSettings } from '@looker/sdk-rtl'
import type { LookerEmbedUser } from './types'

/**
 * The functions in this file demonstrate how to call server
 * side functions for cookieless embed. Please note that the
 * implementation is exceedingly simplistic and only works for
 * a single user in a development environment.
 */

// The Looker session
let lookerSession: NodeSession

// A very simple cache for storing one session per user agent.
// In a production environment the cache key should be based upon
// the embed userid and the browser user agent.
const embedSessions: Record<string, IEmbedCookielessSessionAcquireResponse> = {}

/**
 * Create a Looker session using the Looker SDK. This session can be
 * be shared amongst all embed users. If data is required for the embed
 * user, this session can be used to create a session for the embed user,
 * something like the following but not required for this demo.
 * <pre>
 * const sdk = new Looker40SDK(session)
 * const embedUser = await sdk.ok(
 *   sdk.user_for_credential('embed', embedUserId),
 * )
 * const auth = sdk.authSession as IAuthSession
 * await auth.login(embedUser.id!)
 * <pre>
 */
const acquireLookerSession = async (
  apiUrl: string,
  clientId: string,
  clientSecret: string,
  verifySsl = false
) => {
  if (!lookerSession || !lookerSession.activeToken.isActive()) {
    try {
      const lookerSettings = DefaultSettings()
      lookerSettings.readConfig = (): IApiSection => {
        return { client_id: clientId, client_secret: clientSecret }
      }
      lookerSettings.base_url = apiUrl
      lookerSettings.verify_ssl = verifySsl
      lookerSession = new NodeSession(lookerSettings)
      lookerSession.login()
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
  user: LookerEmbedUser
) => {
  try {
    const embedSession = embedSessions[userAgent]
    const request = {
      ...user,
      session_reference_token: embedSession?.session_reference_token,
    }
    const sdk = new Looker40SDK(lookerSession)
    const response = await sdk.ok(
      sdk.acquire_embed_cookieless_session(request, {
        headers: {
          'User-Agent': userAgent,
        },
      })
    )
    embedSessions[userAgent] = response
    const {
      authentication_token,
      authentication_token_ttl,
      navigation_token,
      navigation_token_ttl,
      session_reference_token_ttl,
      api_token,
      api_token_ttl,
    } = response
    return {
      api_token,
      api_token_ttl,
      authentication_token,
      authentication_token_ttl,
      navigation_token,
      navigation_token_ttl,
      session_reference_token_ttl,
    }
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
  apiUrl: string,
  clientId: string,
  clientSecret: string,
  userAgent: string,
  user: LookerEmbedUser
) {
  await acquireLookerSession(apiUrl, clientId, clientSecret)
  return acquireEmbedSessionInternal(userAgent, user)
}

/**
 * Generate embed navigation and api tokens for the embed session.
 *
 * The Looker Embed SDK requires a callback that will ultimately
 * require that something similar to the following be called.
 */
export async function generateEmbedTokens(
  apiUrl: string,
  clientId: string,
  clientSecret: string,
  userAgent: string
) {
  const embedSession = embedSessions[userAgent]
  if (!embedSession) {
    console.error(
      'embed session generate tokens failed, session not yet acquired'
    )
    throw new Error(
      'embed session generate tokens failed, session not yet acquired'
    )
  }
  await acquireLookerSession(apiUrl, clientId, clientSecret)
  try {
    const { api_token, navigation_token, session_reference_token } =
      embedSession
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
    embedSessions[userAgent] = response
    return {
      api_token: response.api_token,
      api_token_ttl: response.api_token_ttl,
      navigation_token: response.navigation_token,
      navigation_token_ttl: response.navigation_token_ttl,
      session_reference_token_ttl: response.session_reference_token_ttl,
    }
  } catch (error) {
    console.error('embed session generate tokens failed', { error })
    throw error
  }
}
