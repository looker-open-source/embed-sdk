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

import type {
  LookerAuthConfig,
  CookielessCallback,
  CookielessRequestInit,
} from './types'
import { getEmbedSDK } from './LookerEmbedExSDK'

export * from './types'
export * from './LookerEmbedExSDK'
export * from './types'

/**
 * @deprecated Use <code>getEmbedSDK()</code> instead.
 */
export class LookerEmbedSDK {
  /**
   * Initialize the Embed SDK.
   *
   * @param apiHost The address or base URL of the Looker host (example.looker.com:9999, https://example.looker.com:9999)
   *                This is required for verification of messages sent from the embedded content.
   * @param authUrl A server endpoint that will sign SSO embed URLs
   *
   * @deprecated Use <code>getEmbedSDK().init(...)</code> instead.
   */

  static init(apiHost: string, auth?: string | LookerAuthConfig) {
    getEmbedSDK().init(apiHost, auth)
  }

  /**
   * Initialize the Embed SDK to use a cookieless session.
   *
   * @param apiHost The address or base URL of the host (example.looker.com:9999, https://example.looker.com:9999)
   * @param acquireSession is either a string containing a server endpoint that will acquire the embed session OR
   * a RequestInfo object for a fetch call to the server endpoint that will acquire the embed session OR
   * a callback that will invoke the server endpoint that will acquire the embed session.
   * The server endpoint must ultimately call the Looker endpoint `acquire_embed_cookieless_session`.
   * @param generateTokens is either a string containing a server endpoint that will generate new tokens OR
   * a RequestInfo object for a fetch call to the server endpoint that will generate new tokens OR
   * a callback that will invoke the server endpoint that will generate new tokens.
   * The server endpoint should ultimately call the Looker endpoint `generate_tokens_for_cookieless_session`.
   *
   * Looker 22.20+
   *
   * @deprecated Use <code>getEmbedSDK().initCookieless(...)</code> instead.
   */
  static initCookieless(
    apiHost: string,
    acquireSession: string | CookielessRequestInit | CookielessCallback,
    generateTokens: string | CookielessRequestInit | CookielessCallback
  ) {
    getEmbedSDK().initCookieless(apiHost, acquireSession, generateTokens)
  }

  /**
   * Create an EmbedBuilder for an embedded Looker dashboard.
   *
   * @param url A signed SSO embed URL or embed URL for an already authenticated Looker user
   *
   * @deprecated Use <code>getEmbedSDK().createDashboardWithUrl(...)</code> instead.
   */

  static createDashboardWithUrl(url: string) {
    return getEmbedSDK().createDashboardWithUrl(url)
  }

  /**
   * Create an EmbedBuilder for an embedded Looker dashboard.
   *
   * @param id The numeric ID of a Looker User Defined Dashboard, or LookML Dashboard ID
   *
   * @deprecated Use <code>getEmbedSDK().createDashboardWithId(...)</code> instead.
   */

  static createDashboardWithId(id: string | number) {
    return getEmbedSDK().createDashboardWithId(id)
  }

  /**
   * Create an EmbedBuilder for an embedded Looker Explore.
   *
   * @param url A signed SSO embed URL or embed URL for an already authenticated Looker user
   *
   * @deprecated Use <code>getEmbedSDK().createExploreWithUrl(...)</code> instead.
   */

  static createExploreWithUrl(url: string) {
    return getEmbedSDK().createExploreWithUrl(url)
  }

  /**
   * Create an EmbedBuilder for an embedded Looker Explore.
   *
   * @param id The ID of a Looker explore
   *
   * @deprecated Use <code>getEmbedSDK().createExploreWithId(...)</code> instead.
   */

  static createExploreWithId(id: string) {
    return getEmbedSDK().createExploreWithId(id)
  }

  /**
   * Create an EmbedBuilder for an embedded Looker Look.
   *
   * @param url A signed SSO embed URL or embed URL for an already authenticated Looker user
   *
   * @deprecated Use <code>getEmbedSDK().createLookWithUrl(...)</code> instead.
   */

  static createLookWithUrl(url: string) {
    return getEmbedSDK().createLookWithUrl(url)
  }

  /**
   * Create an EmbedBuilder for an embedded Looker dashboard.
   *
   * @param id The ID of a Looker Look
   *
   * @deprecated Use <code>getEmbedSDK().createLookWithId(...)</code> instead.
   */

  static createLookWithId(id: number) {
    return getEmbedSDK().createLookWithId(id)
  }

  /**
   * Create an EmbedBuilder for an embedded Looker extension.
   *
   * @param url A signed SSO embed URL or embed URL for an already authenticated Looker user
   *
   * @deprecated Use <code>getEmbedSDK().createExtensionWithUrl(...)</code> instead.
   */

  static createExtensionWithUrl(url: string) {
    return getEmbedSDK().createExtensionWithUrl(url)
  }

  /**
   * Create an EmbedBuilder for an embedded Looker extension. Requires Looker 7.12
   *
   * @param id The ID of a Looker Look
   *
   * @deprecated Use <code>getEmbedSDK().createExtensionWithId(...)</code> instead.
   */

  static createExtensionWithId(id: string) {
    return getEmbedSDK().createExtensionWithId(id)
  }
}
