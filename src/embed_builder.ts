/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2019 Looker Data Sciences, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import { ChattyHostConnection, CallbackStore } from '@looker/chatty'
import { EmbedClient } from './embed'
import { LookerEmbedEventMap, LookerEmbedFilterParams } from './types'

type EmbedClientConstructor<T> = { new(host: ChattyHostConnection): T ;}

interface LookerEmbedHostSettings {
  apiHost: string
  authUrl?: string
}

interface UrlParams {
  [key: string]: string
}

function stringify (params: {[key: string]: string}) {
  const result = []
  for (const key in params) {
    result.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
  }
  return result.join('&')
}

function escapeFilterParam (param: string) {
  return param.replace(/,/g, '^,')
}

/**
 * The builder class for [[EmbedClient]]. Contains methods for defining the properties of embedded
 * Looker content.
 */

export class EmbedBuilder<T> {
  private _handlers: CallbackStore = {}
  private _appendTo: HTMLElement | null = null
  private _sandboxAttrs: string[] = []
  private _classNames: string[] = []
  private _frameBorder: string = '0'
  private _id?: number | string
  private _params: UrlParams
  private _suffix: string = ''
  private _url?: string | null
  private _sandboxedHost?: boolean

  /**
   * @hidden
   */

  constructor (
    private _hostSettings: LookerEmbedHostSettings,
    private _type: string,
    private _endpoint: string,
    private _clientConstructor: EmbedClientConstructor<T>
  ) {
    if (this.sandboxedHost) {
      this._params = {
        embed_domain: this._hostSettings.apiHost,
        sdk: '2',
        sandboxed_host: 'true'
      }
    } else {
      const embedDomain = window.location.origin
      this._params = {
        embed_domain: embedDomain,
        sdk: '2'
      }
    }
  }

  /**
   * Value for the `frame-border` attribute of an embedded iframe
   */

  withFrameBorder (attr: string) {
    this._frameBorder = attr
    return this
  }

  /**
   * @hidden
   *
   * @param id
   */

  withId (id: number | string) {
    this._id = id
    return this
  }

  /**
   * Allows manual control of URL parameters for the embedded content
   *
   * @param params Additional URL parameters
   * created by ID.
   */

  withParams (params: UrlParams) {
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

  withFilters (filters: LookerEmbedFilterParams, escape: boolean = false) {
    if (this.type === 'dashboard') {
      for (const key in filters) {
        this._params[key] = escape ? escapeFilterParam(filters[key]) : filters[key]
      }
    } else {
      for (const key in filters) {
        this._params[`f[${key}]`] = escape ? escapeFilterParam(filters[key]) : filters[key]
      }
    }
    return this
  }

  /**
   * Allows specifying sandbox attributes for an embedded content iframe. Sandbox attributes
   * should include `allow-scripts` or embedded content will not execute.
   * @param attr one or more sandbox attributes for an embedded content iframe.
   */

  withSandboxAttr (...attr: string[]) {
    this._sandboxAttrs = this._sandboxAttrs.concat(attr)
    return this
  }

  /**
   * Allows specifying classes for an embedded content
   * @param className one or more sandbox attributes for an embedded content.
   */

  withClassName (...className: string[]) {
    this._classNames = this._classNames.concat(className)
    return this
  }

  /**
   * Allows specifying next generation content
   *
   * @param suffix Next generation suffix. Defaults to '-next'.
   */

  withNext (suffix: string = '-next') {
    this._suffix = suffix
    this._endpoint += this._suffix
    return this
  }

  /**
   * Allows specifying a theme for the content.
   *
   * @param theme Theme name
   */

  withTheme (theme: string) {
    this._params.theme = theme
    return this
  }

  /**
   * Allows api host to be specified
   *
   * @param apiHost
   */

  withApiHost (apiHost: string) {
    if (!this._hostSettings.apiHost) {
      this._hostSettings.apiHost = apiHost
      if (this.sandboxedHost) {
        this._params.embed_domain = apiHost
        this._params.sandboxed_host = 'true'
      }
    } else if (this._hostSettings.apiHost !== apiHost) {
      throw new Error('not allowed to change api host')
    }
    return this
  }

  /**
   * Allows auth url to be specified
   *
   * @param authUrl
   */

  withAuthUrl (authUrl: string) {
    if (!this._hostSettings.authUrl) {
      this._hostSettings.authUrl = authUrl
    } else if (this._hostSettings.authUrl !== authUrl) {
      throw new Error('not allowed to change auth url')
    }
    return this
  }

  /**
   * @hidden
   *
   * @param url
   */

  withUrl (url: string) {
    this._url = url
    return this
  }

  /**
   * @hidden
   */

  set sandboxedHost (sandboxedHost: boolean) {
    this._sandboxedHost = sandboxedHost
  }

  /**
   * @hidden
   */

  get sandboxedHost () {
    if (this._sandboxedHost === undefined) {
      const embedHostDomain = window.location.origin
      this._sandboxedHost = embedHostDomain === 'null' || !embedHostDomain
    }
    return this._sandboxedHost
  }

  /**
   * The element to append the embedded content to.
   */

  get el () {
    return this._appendTo || document.body
  }

  /**
   * the frame-border attribute to apply to the iframe
   */

  get frameBorder () {
    return this._frameBorder
  }

  /**
   * The endpoint used to load content
   */

  get endpoint () {
    return this._endpoint
  }

  /**
   * The type of embedded content, dashboard, look, and explore
   */

  get type () {
    return this._type
  }

  /**
   * The address of the Looker instance being used
   */

  get apiHost () {
    return this._hostSettings.apiHost
  }

  /**
   * The content URL of this embedded content, if provided
   */

  get url () {
    return this._url
  }

  /**
   * The auth URL of this embedded content, if provided
   */

  get authUrl () {
    return this._hostSettings.authUrl
  }

  /**
   * @hidden
   */

  get embedUrl () {
    const params = stringify(this._params)
    return `${this.endpoint}/${this.id}?${params}`
  }

  /**
   * @hidden
   */

  get handlers () {
    return this._handlers
  }

  /**
   * The sandbox attributes of an embedded content iframe, if provided
   */

  get sandboxAttrs () {
    return this._sandboxAttrs
  }

  /**
   * The classnames to apply to the embedded content
   */

  get classNames () {
    return this._classNames
  }

  /**
   * The the suffix to append to the content type portion of the url
   */

  get suffix () {
    return this._suffix
  }

  /**
   * The ID of this embedded content, if provided
   */

  get id () {
    return this._id
  }

  /**
   * @hidden
   */

  get clientConstructor () {
    return this._clientConstructor
  }

  /**
   * Select an element to append the embedded content to, either a content selector or
   * the DOM element.
   *
   * @param el
   */

  appendTo (el: HTMLElement | string) {
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

  on<K extends keyof LookerEmbedEventMap> (name: K, handler: LookerEmbedEventMap[K]) {
    this._handlers[name] = this._handlers[name] ? this._handlers[name] : []
    this._handlers[name].push(handler)
    return this
  }

  /**
   * Constructs the embedded content, including creating the DOM element that contains the content.
   */

  build (): EmbedClient<T> {
    return new EmbedClient<T>(this)
  }
}
