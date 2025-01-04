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

  /**
   * @hidden
   */

  constructor(
    private _sdk: LookerEmbedExSDK,
    private _type: string,
    private _endpoint: string
  ) {}

  /**
   * Value for the `frame-border` attribute of an embedded iframe
   */

  withFrameBorder(attr: string): IEmbedBuilder {
    this._frameBorder = attr
    return this
  }

  /**
   * @hidden
   */

  withId(id: number | string): IEmbedBuilder {
    if (this.type === '' || this.endpoint === '') {
      throw new Error('withId requires initialization of type and endpoint')
    }
    this._id = id
    return this
  }

  /**
   * Allows manual control of URL parameters for the embedded content
   *
   * @param params Additional URL parameters
   * created by ID.
   */

  withParams(params: UrlParams): IEmbedBuilder {
    for (const key in params) {
      this._params[key] = params[key]
    }
    return this
  }

  /**
   * Allows specifying initial filters to apply to the embedded content.
   *
   * @filters Filters to apply
   */

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

  /**
   * Allows specifying sandbox attributes for an embedded content iframe. Sandbox attributes
   * should include `allow-scripts` or embedded content will not execute.
   * @param attr one or more sandbox attributes for an embedded content iframe.
   */

  withSandboxAttr(...attr: string[]): IEmbedBuilder {
    this._sandboxAttrs = this._sandboxAttrs.concat(attr)
    return this
  }

  /**
   * Allows specifying allow attributes (for example fullscreen) for an embedded content iframe.
   * @param attr one or more allow attributes for an embedded content iframe.
   */

  withAllowAttr(...attr: string[]): IEmbedBuilder {
    this._allowAttrs = this._allowAttrs.concat(attr)
    return this
  }

  /**
   * Allows specifying classes for an embedded content
   * @param className one or more sandbox attributes for an embedded content.
   */

  withClassName(...className: string[]): IEmbedBuilder {
    this._classNames = this._classNames.concat(className)
    return this
  }

  /**
   * Allows specifying a theme for the content.
   *
   * @param theme Theme name
   */

  withTheme(theme: string): IEmbedBuilder {
    this._params.theme = theme
    return this
  }

  /**
   * Monitors scroll position and informs the embedded Looker IFRAME
   * of the current scroll position and the offset of the containing
   * IFRAME within the window. Looker uses this information to position
   * dialogs within the users viewport.
   *
   * Requires Looker >=23.6.0
   *
   * @param monitor defaults to true
   *
   */
  withScrollMonitor(monitor: boolean | undefined = true): IEmbedBuilder {
    this._scrollMonitor = monitor
    return this
  }

  /**
   * Listens for page changed events from the embedded Looker IFRAME
   * and updates the height of the IFRAME.
   *
   * @param dynamicIFrameHeight defaults to true
   */
  withDynamicIFrameHeight(
    dynamicIFrameHeight: boolean | undefined = true
  ): IEmbedBuilder {
    this._dynamicIFrameHeight = dynamicIFrameHeight
    return this
  }

  /**
   * Listens for covering dialogs being opened in the Looker IFRAME
   * and scrolls the top of dialog into view.
   *
   * @param dialogScroll defaults to true
   */
  withDialogScroll(dialogScroll: boolean | undefined = true): IEmbedBuilder {
    this._dialogScroll = dialogScroll
    return this
  }

  /**
   * Allows api host to be specified
   *
   * @param apiHost
   */

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

  /**
   * Allows auth url to be specified
   *
   * @param authUrl URL to endpoint that can sign Looker SSO URLs
   */

  withAuthUrl(authUrl: string): IEmbedBuilder {
    if (this._sdk.auth?.url === '') {
      this._sdk.auth = { url: authUrl }
    } else if (this._sdk.auth.url !== authUrl) {
      throw new Error('not allowed to change auth url')
    }
    return this
  }

  /**
   * Allows auth url to be specified
   *
   * @param auth
   */

  withAuth(auth: LookerAuthConfig): IEmbedBuilder {
    if (this._sdk.auth?.url === '') {
      this._sdk.auth = { ...auth }
    } else if (this._sdk.auth !== auth) {
      throw new Error('not allowed to change auth url')
    }
    return this
  }

  /**
   * @hidden
   *
   * @param url
   */

  withUrl(url: string): IEmbedBuilder {
    this._url = url
    return this
  }

  /**
   * @hidden
   */

  set sandboxedHost(sandboxedHost: boolean) {
    this._sandboxedHost = sandboxedHost
  }

  /**
   * @hidden
   */

  get sandboxedHost() {
    if (this._sandboxedHost === undefined) {
      const embedHostDomain = window.location.origin
      this._sandboxedHost = embedHostDomain === 'null' || !embedHostDomain
    }
    return this._sandboxedHost
  }

  /**
   * The element to append the embedded content to.
   */

  get el() {
    return this._appendTo || document.body
  }

  /**
   * the frame-border attribute to apply to the iframe
   */

  get frameBorder() {
    return this._frameBorder
  }

  /**
   * The endpoint used to load content
   */

  get endpoint() {
    return this._endpoint
  }

  /**
   * The type of embedded content, dashboard, look, and explore
   */

  get type() {
    return this._type
  }

  /**
   * The address of the Looker instance being used
   */

  get apiHost() {
    return this._sdk.apiHost
  }

  /**
   * Is cookieless embedding being used
   */

  get isCookielessEmbed() {
    return !!this._sdk.acquireSession
  }

  /**
   * Cookieless embed acquire session
   */
  get acquireSession() {
    return this._sdk.acquireSession
  }

  /**
   * Cookieless embed generate tokens
   */
  get generateTokens() {
    return this._sdk.generateTokens
  }

  /**
   * The content URL of this embedded content, if provided
   */

  get url() {
    return this._url || ''
  }

  /**
   * The auth config of this embedded content, if provided
   */

  get auth() {
    return this._sdk.auth
  }

  /**
   * @hidden
   */

  get embedUrl() {
    if (this.url && !this.url.startsWith('https://')) {
      return `${this.endpoint}${this.url}`
    } else {
      const params = stringify(this._params)
      const sep = params.length === 0 ? '' : '?'
      return `${this.endpoint}/${this.id}${sep}${params}`
    }
  }

  /**
   * @hidden
   */

  get handlers() {
    return this._handlers
  }

  /**
   * The sandbox attributes of an embedded content iframe, if provided
   */

  get sandboxAttrs() {
    return this._sandboxAttrs
  }

  /**
   * The allowed attributes of an embedded content iframe, if provided
   */

  get allowAttrs() {
    return this._allowAttrs
  }

  /**
   * The classnames to apply to the embedded content
   */

  get classNames() {
    return this._classNames
  }

  /**
   * The the suffix to append to the content type portion of the url
   * @deprecated will always return an empty string
   */

  get suffix() {
    return ''
  }

  /**
   * The ID of this embedded content, if provided
   */

  get id() {
    return this._id
  }

  /**
   * Whether scrolling is monitored
   */

  get scrollMonitor() {
    return this._scrollMonitor
  }

  /**
   * Whether IFRAME height is to be dynamically updated
   */

  get dynamicIFrameHeight() {
    return this._dynamicIFrameHeight
  }

  /**
   * Whether cover dialogs tops are to be scrolled into view
   */

  get dialogScroll() {
    return this._dialogScroll
  }

  /**
   * Select an element to append the embedded content to, either a content selector or
   * the DOM element.
   *
   * @param el
   */

  appendTo(el: HTMLElement | string): IEmbedBuilder {
    if (typeof el === 'string') {
      this._appendTo = document.querySelector(el)
    } else {
      this._appendTo = el
    }
    return this
  }

  /**
   * Register an event handler.
   *
   * @typeparam K: A Looker embed event name
   * @param name: string Name of the event to respond to.
   * @param handler: Callback A callback method to be invoked when the message is received.
   */

  on<K extends keyof LookerEmbedEventMap>(
    name: K,
    handler: LookerEmbedEventMap[K]
  ): IEmbedBuilder {
    this._handlers[name] = this._handlers[name] ? this._handlers[name] : []
    this._handlers[name].push(handler)
    return this
  }

  /**
   * Constructs the embedded content, including creating the DOM element that contains the content.
   */

  build(): IEmbedClient {
    return new EmbedClientEx(this._sdk, this)
  }
}
