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
import type { CallbackStore } from '@looker/chatty'
import type { UrlParams } from '../embed_builder'
import type {
  LookerAuthConfig,
  LookerEmbedEventMap,
  LookerEmbedFilterParams,
} from '../types'
import { stringify, escapeFilterParam } from '../utils'
import type { LookerEmbedExSDK } from './LookerEmbedExSDK'
import { EmbedClientEx } from './EmbedClientEx'
import type { IEmbedBuilder, IEmbedClient } from './types'

export class EmbedBuilderEx implements IEmbedBuilder {
  private _handlers: CallbackStore = {}
  private _appendTo: HTMLElement | null = null
  private _sandboxAttrs: string[] = []
  private _allowAttrs: string[] = []
  private _classNames: string[] = []
  private _frameBorder: string = '0'
  private _id?: number | string
  private _params: UrlParams = {}
  private _url?: string | null
  private _sandboxedHost?: boolean
  private _scrollMonitor?: boolean
  private _dynamicIFrameHeight?: boolean
  private _dialogScroll?: boolean

  constructor(
    private _sdk: LookerEmbedExSDK,
    private _type: string,
    private _endpoint: string
  ) {}

  withFrameBorder(attr: string): IEmbedBuilder {
    this._frameBorder = attr
    return this
  }

  withId(id: number | string): IEmbedBuilder {
    if (this.type === '' || this.endpoint === '') {
      throw new Error('withId requires initialization of type and endpoint')
    }
    this._id = id
    return this
  }

  withParams(params: UrlParams): IEmbedBuilder {
    for (const key in params) {
      this._params[key] = params[key]
    }
    return this
  }

  withFilters(
    filters: LookerEmbedFilterParams,
    escape: boolean | undefined = false
  ): IEmbedBuilder {
    if (this.type === 'dashboard') {
      for (const key in filters) {
        this._params[key] = escape
          ? escapeFilterParam(filters[key])
          : filters[key]
      }
    } else {
      for (const key in filters) {
        this._params[`f[${key}]`] = escape
          ? escapeFilterParam(filters[key])
          : filters[key]
      }
    }
    return this
  }

  withSandboxAttr(...attr: string[]): IEmbedBuilder {
    this._sandboxAttrs = this._sandboxAttrs.concat(attr)
    return this
  }

  withAllowAttr(...attr: string[]): IEmbedBuilder {
    this._allowAttrs = this._allowAttrs.concat(attr)
    return this
  }

  withClassName(...className: string[]): IEmbedBuilder {
    this._classNames = this._classNames.concat(className)
    return this
  }

  withTheme(theme: string): IEmbedBuilder {
    this._params.theme = theme
    return this
  }

  withScrollMonitor(monitor: boolean | undefined = true): IEmbedBuilder {
    this._scrollMonitor = monitor
    return this
  }

  withDynamicIFrameHeight(
    dynamicIFrameHeight: boolean | undefined = true
  ): IEmbedBuilder {
    this._dynamicIFrameHeight = dynamicIFrameHeight
    return this
  }

  withDialogScroll(dialogScroll: boolean | undefined = true): IEmbedBuilder {
    this._dialogScroll = dialogScroll
    return this
  }

  withApiHost(apiHost: string): IEmbedBuilder {
    if (!this._sdk.apiHost) {
      this._sdk.apiHost = apiHost
      if (this.sandboxedHost) {
        this._params.embed_domain = apiHost
        this._params.sandboxed_host = 'true'
      }
    } else if (this._sdk.apiHost !== apiHost) {
      throw new Error('not allowed to change api host')
    }
    return this
  }

  withAuthUrl(authUrl: string): IEmbedBuilder {
    if (this._sdk.auth?.url === '') {
      this._sdk.auth = { url: authUrl }
    } else if (this._sdk.auth.url !== authUrl) {
      throw new Error('not allowed to change auth url')
    }
    return this
  }

  withAuth(auth: LookerAuthConfig): IEmbedBuilder {
    if (this._sdk.auth?.url === '') {
      this._sdk.auth = { ...auth }
    } else if (this._sdk.auth !== auth) {
      throw new Error('not allowed to change auth url')
    }
    return this
  }

  withUrl(url: string): IEmbedBuilder {
    this._url = url
    return this
  }

  set sandboxedHost(sandboxedHost: boolean) {
    this._sandboxedHost = sandboxedHost
  }

  get sandboxedHost() {
    if (this._sandboxedHost === undefined) {
      const embedHostDomain = window.location.origin
      this._sandboxedHost = embedHostDomain === 'null' || !embedHostDomain
    }
    return this._sandboxedHost
  }

  get el() {
    return this._appendTo || document.body
  }

  get frameBorder() {
    return this._frameBorder
  }

  get endpoint() {
    return this._endpoint
  }

  get type() {
    return this._type
  }

  get apiHost() {
    return this._sdk.apiHost
  }

  get isCookielessEmbed() {
    return !!this._sdk.acquireSession && !!this._sdk.generateTokens
  }

  get acquireSession() {
    return this._sdk.acquireSession
  }

  get generateTokens() {
    return this._sdk.generateTokens
  }

  get url() {
    return this._url || ''
  }

  get auth() {
    return this._sdk.auth
  }

  get embedUrl() {
    const params = stringify(this._params)
    if (this.url) {
      let sep = ''
      if (params.length > 0) {
        sep = this.url.includes('?') ? '&' : '?'
      }
      return `${this.endpoint}${this.url}${sep}${params}`
    } else {
      const sep = params.length === 0 ? '' : '?'
      return `${this.endpoint}/${this.id}${sep}${params}`
    }
  }

  get handlers() {
    return this._handlers
  }

  get sandboxAttrs() {
    return this._sandboxAttrs
  }

  get allowAttrs() {
    return this._allowAttrs
  }

  get classNames() {
    return this._classNames
  }

  get id() {
    return this._id
  }

  get scrollMonitor() {
    return this._scrollMonitor
  }

  get dynamicIFrameHeight() {
    return this._dynamicIFrameHeight
  }

  get dialogScroll() {
    return this._dialogScroll
  }

  appendTo(el: HTMLElement | string): IEmbedBuilder {
    if (typeof el === 'string') {
      this._appendTo = document.querySelector(el)
    } else {
      this._appendTo = el
    }
    return this
  }

  on<K extends keyof LookerEmbedEventMap>(
    name: K,
    handler: LookerEmbedEventMap[K]
  ): IEmbedBuilder {
    this._handlers[name] = this._handlers[name] ? this._handlers[name] : []
    this._handlers[name].push(handler)
    return this
  }

  build(): IEmbedClient {
    return new EmbedClientEx(this._sdk, this)
  }
}
