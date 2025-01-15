/*

 MIT License

 Copyright (c) 2024 Looker Data Sciences, Inc.

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
import type { ChattyHostBuilder } from '@looker/chatty'
import { Chatty } from '@looker/chatty'
import {
  extractPageTypeFromUrl,
  sanitizeHostUrl,
  santizeEmbedUrl,
} from '../utils'
import type {
  CookielessCallback,
  GenerateTokensCallback,
  CookielessRequestInit,
  LookerAuthConfig,
  LookerEmbedCookielessSessionData,
} from '../types'
import type { ILookerEmbedSDK, IEmbedBuilder } from './types'
import { EmbedBuilderEx } from './EmbedBuilderEx'

/**
 * @hidden
 */

export type ChattyHostBuilderFactory = (url: string) => ChattyHostBuilder

/**
 * @hidden
 */

export const createChattyBuilder = (url: string) => Chatty.createHost(url)

/**
 * @hidden
 */
export interface ICookielessEmbedSession {
  generateTokensTime: number
  cookielessApiToken?: string | null
  cookielessApiTokenTtl?: number | null
  cookielessNavigationToken?: string | null
  cookielessNavigationTokenTtl?: number | null
  cookielessSessionReferenceTokenTtl?: number | null
}

export class LookerEmbedExSDK implements ILookerEmbedSDK {
  /**
   * @hidden
   */

  _sessionCreated = false

  /**
   * @hidden
   */

  _createEmbedSessionPromise?: Promise<string>

  /**
   * @hidden
   */

  _createEmbedSessionPromiseResolver?: (
    value: string | PromiseLike<string>
  ) => void

  /**
   * @hidden
   */

  _generateTokensPromise?: Promise<LookerEmbedCookielessSessionData>

  /**
   * @hidden
   */

  _apiHost?: string

  /**
   * @hidden
   */

  _auth?: LookerAuthConfig

  /**
   * @hidden
   */

  _acquireSession?: string | CookielessRequestInit | CookielessCallback

  /**
   * @hidden
   */

  _generateTokens?: string | CookielessRequestInit | GenerateTokensCallback

  /**
   * @hidden
   */
  _cookielessSession?: ICookielessEmbedSession

  /**
   * @hidden
   */

  constructor(
    // Allow tests to inject their own chatty implementation
    private _chattyHostCreator: ChattyHostBuilderFactory = createChattyBuilder
  ) {}

  init(apiHost: string, auth?: string | LookerAuthConfig) {
    this._apiHost = sanitizeHostUrl(apiHost)
    this._auth = typeof auth === 'string' ? { url: auth } : auth
    this._acquireSession = undefined
    this._generateTokens = undefined
    this._cookielessSession = undefined
  }

  initCookieless(
    apiHost: string,
    acquireSession: string | CookielessRequestInit | CookielessCallback,
    generateTokens: string | CookielessRequestInit | GenerateTokensCallback
  ) {
    this._apiHost = sanitizeHostUrl(apiHost)
    this._acquireSession = acquireSession
    this._generateTokens = generateTokens
    this._auth = undefined
    this._cookielessSession = {
      generateTokensTime: 0,
    }
  }

  preload() {
    return this.createWithUrl('/embed/preload/')
  }

  createWithUrl(url: string): IEmbedBuilder {
    return new EmbedBuilderEx(this, extractPageTypeFromUrl(url), '').withUrl(
      santizeEmbedUrl(url)
    )
  }

  createDashboardWithUrl(url: string): IEmbedBuilder {
    return new EmbedBuilderEx(this, 'dashboards', '').withUrl(
      santizeEmbedUrl(url)
    )
  }

  createDashboardWithId(id: string | number) {
    return new EmbedBuilderEx(this, 'dashboards', '/embed/dashboards').withId(
      String(id)
    )
  }

  createExploreWithUrl(url: string) {
    return new EmbedBuilderEx(this, 'explore', '').withUrl(santizeEmbedUrl(url))
  }

  createExploreWithId(id: string) {
    id = id.replace('::', '/') // Handle old format explore ids.
    return new EmbedBuilderEx(this, 'explore', '/embed/explore').withId(id)
  }

  createLookWithUrl(url: string) {
    return new EmbedBuilderEx(this, 'looks', '').withUrl(santizeEmbedUrl(url))
  }

  createLookWithId(id: number | string) {
    return new EmbedBuilderEx(this, 'looks', '/embed/looks').withId(String(id))
  }

  createExtensionWithUrl(url: string) {
    return new EmbedBuilderEx(this, 'extensions', '').withUrl(
      santizeEmbedUrl(url)
    )
  }

  createExtensionWithId(id: string) {
    return new EmbedBuilderEx(this, 'extensions', '/embed/extensions').withId(
      id
    )
  }

  createQueryVisualizationWithUrl(url: string) {
    return new EmbedBuilderEx(this, 'query-visualization', '').withUrl(
      santizeEmbedUrl(url)
    )
  }

  createQueryVisualizationWithId(id: string) {
    return new EmbedBuilderEx(
      this,
      'query-visualization',
      '/embed/query-visualization'
    ).withId(id)
  }

  createReportWithUrl(url: string) {
    return new EmbedBuilderEx(this, 'reports', '').withUrl(santizeEmbedUrl(url))
  }

  createReportWithId(id: string) {
    return new EmbedBuilderEx(this, 'reports', '/embed/reports').withId(id)
  }

  /**
   * @hidden
   */

  get apiHost() {
    return this._apiHost || ''
  }

  /**
   * @hidden
   */

  set apiHost(apiHost: string) {
    this._apiHost = apiHost
  }

  /**
   * @hidden
   */

  get auth() {
    return this._auth || { url: '' }
  }

  /**
   * @hidden
   */

  set auth(auth: LookerAuthConfig) {
    this._auth = auth
  }

  /**
   * @hidden
   */

  get acquireSession() {
    return this._acquireSession || ''
  }

  /**
   * @hidden
   */

  get generateTokens() {
    return this._generateTokens || ''
  }

  /**
   * @hidden
   */

  get chattyHostCreator(): ChattyHostBuilderFactory {
    return this._chattyHostCreator
  }
}

let _embedSdk: LookerEmbedExSDK

/**
 * Get the Embed SDK
 */

export const getEmbedSDK = (
  /**
   * @hidden
   */
  embedSdk?: LookerEmbedExSDK
) => {
  if (embedSdk) {
    _embedSdk = embedSdk
  } else if (!_embedSdk) {
    _embedSdk = new LookerEmbedExSDK()
  }
  return _embedSdk
}
