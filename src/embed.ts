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

import { EmbedBuilder } from './embed_builder'
import { LookerEmbedBase } from './embed_base'
import { Chatty, ChattyHost, ChattyHostBuilder } from '@looker/chatty'

const IS_URL = /^https?:\/\//

/**
 * Wrapper for Looker embedded content. Provides a mechanism for creating the embedded content element,
 * and for establishing two-way communication between the parent window and the embedded content.
 */

export class EmbedClient<T> {
  _hostBuilder: ChattyHostBuilder | null = null
  _host: ChattyHost | null = null
  _connection: Promise<T> | null = null
  _client: T | null = null
  _cookielessInitialized = false
  _cookielessApiToken?: string | null
  _cookielessApiTokenTtl?: number | null
  _cookielessNavigationToken?: string | null
  _cookielessNavigationTokenTtl?: number | null

  /**
   * @hidden
   */

  constructor (private _builder: EmbedBuilder<T>) {}

  /**
   * Returns a promise that resolves to a client that can be used to send messages to the
   * embedded content.
   */

  get connection () {
    return this._connection
  }

  /**
   * Indicates whether two way communication has successfully been established with the embedded content.
   */

  get isConnected () {
    return !!this._connection
  }

  get targetOrigin () {
    if (this._builder.sandboxedHost) {
      return '*'
    }
    const apiHost = this._builder.apiHost
    return IS_URL.test(apiHost) ? apiHost : `https://${apiHost}`
  }

  private async createIframe (url: string) {
    this._hostBuilder = Chatty.createHost(url)
    if (this._builder.isCookielessEmbed) {
      this._builder.handlers['session:tokens:request'] = [
        async () => {
          if (this._client && this._cookielessApiToken && this._builder.cookielessRefreshApiTokenCallback) {
            if (this._cookielessInitialized) {
              const { api_token, api_token_ttl, navigation_token, navigation_token_ttl } =
                await this._builder.cookielessRefreshApiTokenCallback()
              this._cookielessApiToken = api_token
              this._cookielessApiTokenTtl = api_token_ttl
              this._cookielessNavigationToken = navigation_token
              this._cookielessNavigationTokenTtl = navigation_token_ttl
            } else {
              this._cookielessInitialized = true
            }
            const client = this._client as unknown as LookerEmbedBase
            client.send('session:tokens', {
              api_token: this._cookielessApiToken,
              api_token_ttl: this._cookielessApiTokenTtl,
              navigation_token: this._cookielessNavigationToken,
              navigation_token_ttl: this._cookielessNavigationTokenTtl
            })
          }
        }
      ]
    }
    for (const eventType in this._builder.handlers) {
      for (const handler of this._builder.handlers[eventType]) {
        this._hostBuilder.on(eventType, (...args) => handler.apply(this._client, args))
      }
    }
    for (const attr of this._builder.sandboxAttrs) {
      this._hostBuilder.withSandboxAttribute(attr)
    }
    this._host = this._hostBuilder
      // tslint:disable-next-line:deprecation
      .frameBorder(this._builder.frameBorder)
      .withTargetOrigin(this.targetOrigin)
      .appendTo(this._builder.el)
      .build()

    // IE doesn't like calling classList.add() with no arguments, so check
    if (this._builder.classNames.length) {
      this._host.iframe.classList.add(...this._builder.classNames)
    }

    return this._host.connect().then((host) => {
      this._client = new this._builder.clientConstructor(host)
      return this._client
    })
  }

  private async createUrl () {
    const src = this._builder.embedUrl
    const auth = this._builder.auth
    if (!auth?.url) return `${this._builder.apiHost}${src}`

    let url = `${auth.url}?src=${encodeURIComponent(src)}`
    if (auth.params) {
      for (const param of auth.params) {
        url += `&${encodeURIComponent(param.name)}=${encodeURIComponent(param.value)}`
      }
    }

    return new Promise<string>(async (resolve, reject) => {
      // compute signature
      const xhr = new XMLHttpRequest()
      xhr.open('GET', url)
      if (auth.withCredentials) {
        xhr.withCredentials = auth.withCredentials
      }
      xhr.setRequestHeader('Cache-Control', 'no-cache')
      if (auth.headers) {
        for (const header of auth.headers) {
          xhr.setRequestHeader(header.name, header.value)
        }
      }
      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText).url)
        } else {
          reject(xhr.statusText)
        }
      }
      xhr.onerror = () => reject(xhr.statusText)
      xhr.send()
    })
  }

  private async createCookielessEmbedSession (): Promise<string> {
    const { cookielessSessionPrepareCallback, cookielessRefreshApiTokenCallback } = this._builder
    if (!cookielessSessionPrepareCallback) {
      throw new Error('invalid state: cookielessSessionPrepareCallback not defined')
    }
    if (!this._builder.cookielessRefreshApiTokenCallback) {
      throw new Error('invalid state: cookielessRefreshApiTokenCallback not defined')
    }
    const { authentication_token, api_token, api_token_ttl, navigation_token, navigation_token_ttl } =
      await cookielessSessionPrepareCallback()
    if (!authentication_token || !navigation_token || !api_token) {
      throw new Error('failed to prepare cookieless embed session')
    }
    this._cookielessApiToken = api_token
    this._cookielessApiTokenTtl = api_token_ttl
    this._cookielessNavigationToken = navigation_token
    this._cookielessNavigationTokenTtl = navigation_token_ttl
    const src = `${this._builder.embedUrl}?embed_navigation_token=${navigation_token}`
    const embedPath = '/login/embed2/' + encodeURIComponent(src) + `?embed_authentication_token=${authentication_token}`
    return `https://${this._builder.apiHost}${embedPath}`
  }

  /**
   * Establish two way communication with embedded content. Returns a promise that resolves to a
   * client that can be used to send messages to the embedded content.
   */

  async connect (): Promise<T> {
    if (this._connection) return this._connection

    if (this._builder.url) {
      this._connection = this.createIframe(this._builder.url)
    } else {
      if (this._builder.isCookielessEmbed) {
        this._connection = this.createCookielessEmbedSession().then(async (url) => this.createIframe(url))
      } else {
        this._connection = this.createUrl().then(async (url) => this.createIframe(url))
      }
    }
    return this._connection
  }
}
