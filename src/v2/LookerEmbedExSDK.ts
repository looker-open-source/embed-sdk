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
import type {
  CookielessCallback,
  CookielessRequestInit,
  LookerAuthConfig,
} from '../types'
import type { ILookerEmbedSDK, IEmbedBuilder } from './types'
import { EmbedBuilderEx } from './EmbedBuilderEx'

export type ChattyHostBuilderFactory = (url: string) => ChattyHostBuilder

const createChattyBuilder = (url: string) => Chatty.createHost(url)

export class LookerEmbedExSDK implements ILookerEmbedSDK {
  _sessionAcquired = false
  _acquireSessionPromise?: Promise<string>
  _apiHost?: string
  _auth?: LookerAuthConfig
  _acquireSession?: string | CookielessRequestInit | CookielessCallback
  _generateTokens?: string | CookielessRequestInit | CookielessCallback

  constructor(
    // Allow tests to inject their own chatty implementation
    private _chattyHostCreator: ChattyHostBuilderFactory = createChattyBuilder
  ) {}

  init(apiHost: string, auth?: string | LookerAuthConfig) {
    this._apiHost = apiHost
    this._auth = typeof auth === 'string' ? { url: auth } : auth
    this._acquireSession = undefined
    this._generateTokens = undefined
  }

  initCookieless(
    apiHost: string,
    acquireSession: string | CookielessRequestInit | CookielessCallback,
    generateTokens: string | CookielessRequestInit | CookielessCallback
  ) {
    this._apiHost = apiHost
    this._acquireSession = acquireSession
    this._generateTokens = generateTokens
    this._auth = undefined
  }

  preload() {
    return this.createWithUrl('/embed/preload/')
  }

  createWithUrl(url: string): IEmbedBuilder {
    return new EmbedBuilderEx(this, '', '').withUrl(url)
  }

  createDashboardWithUrl(url: string): IEmbedBuilder {
    return new EmbedBuilderEx(this, 'dashboard', '').withUrl(url)
  }

  createDashboardWithId(id: string | number) {
    return new EmbedBuilderEx(this, 'dashboard', '/embed/dashboards').withId(
      String(id)
    )
  }

  createExploreWithUrl(url: string) {
    return new EmbedBuilderEx(this, 'explore', '').withUrl(url)
  }

  createExploreWithId(id: string) {
    id = id.replace('::', '/') // Handle old format explore ids.
    return new EmbedBuilderEx(this, 'explore', '/embed/explore').withId(id)
  }

  createLookWithUrl(url: string) {
    return new EmbedBuilderEx(this, 'look', '').withUrl(url)
  }

  createLookWithId(id: number | string) {
    return new EmbedBuilderEx(this, 'look', '/embed/looks').withId(String(id))
  }

  createExtensionWithUrl(url: string) {
    return new EmbedBuilderEx(this, 'extension', '').withUrl(url)
  }

  createExtensionWithId(id: string) {
    return new EmbedBuilderEx(this, 'extension', '/embed/extensions').withId(id)
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

  get chattyHostCreator(): ChattyHostBuilderFactory {
    return this._chattyHostCreator
  }
}
