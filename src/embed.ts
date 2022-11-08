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

import type { ChattyHost, ChattyHostBuilder } from '@looker/chatty'
import { Chatty } from '@looker/chatty'
import type { LookerEmbedBase } from './embed_base'
import type { EmbedBuilder } from './embed_builder'
import type {
  CookielessRequestInit,
  LookerEmbedCookielessSessionData,
} from './types'

const IS_URL = /^https?:\/\//

/**
 * Wrapper for Looker embedded content. Provides a mechanism for creating the embedded content element,
 * and for establishing two-way communication between the parent window and the embedded content.
 */

export class EmbedClient<T> {
  private static sessionAcquired = false
  private static acquireSessionPromise?: Promise<string>

  _hostBuilder: ChattyHostBuilder | null = null
  _host: ChattyHost | null = null
  _connection: Promise<T> | null = null
  _client: T | null = null
  _cookielessInitialized = false
  _cookielessApiToken?: string | null
  _cookielessApiTokenTtl?: number | null
  _cookielessNavigationToken?: string | null
  _cookielessNavigationTokenTtl?: number | null
  _cookielessSessionReferenceTokenTtl?: number | null

  /**
   * @hidden
   */

  constructor(private _builder: EmbedBuilder<T>) {}

  /**
   * Returns a promise that resolves to a client that can be used to send messages to the
   * embedded content.
   */

  get connection() {
    return this._connection
  }

  /**
   * Indicates whether two way communication has successfully been established with the embedded content.
   */

  get isConnected() {
    return !!this._connection
  }

  get targetOrigin() {
    if (this._builder.sandboxedHost) {
      return '*'
    }
    const apiHost = this._builder.apiHost
    return IS_URL.test(apiHost) ? apiHost : `https://${apiHost}`
  }

  private async createIframe(url: string) {
    this._hostBuilder = Chatty.createHost(url)
    if (this._builder.isCookielessEmbed) {
      this._builder.handlers['session:tokens:request'] = [
        async () => {
          if (
            this._client &&
            this._cookielessApiToken &&
            this._builder.generateTokens
          ) {
            if (this._cookielessInitialized) {
              const {
                api_token,
                api_token_ttl,
                navigation_token,
                navigation_token_ttl,
                session_reference_token_ttl,
              } = await this.generateTokens()
              this._cookielessApiToken = api_token
              this._cookielessApiTokenTtl = api_token_ttl
              this._cookielessNavigationToken = navigation_token
              this._cookielessNavigationTokenTtl = navigation_token_ttl
              this._cookielessSessionReferenceTokenTtl =
                session_reference_token_ttl
            } else {
              this._cookielessInitialized = true
            }
            const client = this._client as unknown as LookerEmbedBase
            client.send('session:tokens', {
              api_token: this._cookielessApiToken,
              api_token_ttl: this._cookielessApiTokenTtl,
              navigation_token: this._cookielessNavigationToken,
              navigation_token_ttl: this._cookielessNavigationTokenTtl,
              session_reference_token_ttl:
                this._cookielessSessionReferenceTokenTtl,
            })
          }
        },
      ]
    }
    for (const eventType in this._builder.handlers) {
      for (const handler of this._builder.handlers[eventType]) {
        this._hostBuilder.on(eventType, (...args) =>
          handler.apply(this._client, args)
        )
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
      // eslint-disable-next-line new-cap
      this._client = new this._builder.clientConstructor(host)
      return this._client
    })
  }

  private async createUrl() {
    const src = this._builder.embedUrl
    const auth = this._builder.auth
    if (!auth?.url) return `${this._builder.apiHost}${src}`

    let url = `${auth.url}?src=${encodeURIComponent(src)}`
    if (auth.params) {
      for (const param of auth.params) {
        url += `&${encodeURIComponent(param.name)}=${encodeURIComponent(
          param.value
        )}`
      }
    }

    // eslint-disable-next-line no-async-promise-executor
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

  private async acquireCookielessEmbedSession(): Promise<string> {
    if (EmbedClient.sessionAcquired) {
      return this.acquireCookielessEmbedSessionInternal()
    }
    if (EmbedClient.acquireSessionPromise) {
      await EmbedClient.acquireSessionPromise
      return this.acquireCookielessEmbedSessionInternal()
    }
    EmbedClient.acquireSessionPromise =
      this.acquireCookielessEmbedSessionInternal()
    return EmbedClient.acquireSessionPromise.then((url) => {
      EmbedClient.sessionAcquired = true
      return url
    })
  }

  private async acquireCookielessEmbedSessionInternal(): Promise<string> {
    const { acquireSession, generateTokens } = this._builder
    if (!acquireSession) {
      throw new Error('invalid state: acquireSession not defined')
    }
    if (!generateTokens) {
      throw new Error('invalid state: generateTokens not defined')
    }
    const {
      authentication_token,
      api_token,
      api_token_ttl,
      navigation_token,
      navigation_token_ttl,
      session_reference_token_ttl,
    } = await this.acquireSession()
    if (!authentication_token || !navigation_token || !api_token) {
      throw new Error('failed to prepare cookieless embed session')
    }
    this._cookielessApiToken = api_token
    this._cookielessApiTokenTtl = api_token_ttl
    this._cookielessNavigationToken = navigation_token
    this._cookielessNavigationTokenTtl = navigation_token_ttl
    this._cookielessSessionReferenceTokenTtl = session_reference_token_ttl
    const apiHost = `https://${this._builder.apiHost}`
    const sep =
      new URL(this._builder.embedUrl, apiHost).search === '' ? '?' : '&'
    const src = `${this._builder.embedUrl}${sep}embed_navigation_token=${navigation_token}`
    const embedPath =
      '/login/embed/' +
      encodeURIComponent(src) +
      `?embed_authentication_token=${authentication_token}`
    return `${apiHost}${embedPath}`
  }

  private async acquireSession(): Promise<LookerEmbedCookielessSessionData> {
    const { acquireSession } = this._builder
    if (typeof acquireSession === 'function') {
      return await acquireSession()
    }
    try {
      const { url, init } = this.getResource(acquireSession!)
      const resp = await fetch(url, init)
      if (!resp.ok) {
        console.error('acquire embed session failed', { resp })
        throw new Error(`acquire embed session failed`)
      }
      return (await resp.json()) as LookerEmbedCookielessSessionData
    } catch (error: any) {
      console.error(error)
      throw new Error(`acquire embed session failed`)
    }
  }

  private async generateTokens(): Promise<LookerEmbedCookielessSessionData> {
    const { generateTokens } = this._builder
    if (typeof generateTokens === 'function') {
      return await generateTokens()
    }
    try {
      const { url, init: defaultInit } = this.getResource(generateTokens!)
      const init = defaultInit || {
        body: JSON.stringify({
          api_token: this._cookielessApiToken,
          navigation_token: this._cookielessNavigationToken,
        }),
        headers: {
          'content-type': 'application/json',
        },
        method: 'PUT',
      }
      const resp = await fetch(url, init)
      if (!resp.ok) {
        if (resp.status === 400) {
          return { session_reference_token_ttl: 0 }
        }
        console.error('generate tokens failed', { resp })
        throw new Error(`generate tokens failed`)
      }
      return (await resp.json()) as LookerEmbedCookielessSessionData
    } catch (error: any) {
      console.error(error)
      throw new Error(`generate tokens failed`)
    }
  }

  private getResource(resource: string | CookielessRequestInit) {
    let url
    let init
    if (typeof resource === 'object') {
      const { url: tempUrl, ...rest } = resource
      init = rest
      url = tempUrl
    } else {
      url = resource
    }
    return { init, url }
  }

  /**
   * Establish two way communication with embedded content. Returns a promise that resolves to a
   * client that can be used to send messages to the embedded content.
   */

  async connect(): Promise<T> {
    if (this._connection) return this._connection

    if (this._builder.url) {
      if (this._builder.isCookielessEmbed) {
        throw new Error('withUrl not supported by cookieless embed')
      }
      this._connection = this.createIframe(this._builder.url)
    } else {
      if (this._builder.isCookielessEmbed) {
        this._connection = this.acquireCookielessEmbedSession().then(
          async (url) => this.createIframe(url)
        )
      } else {
        this._connection = this.createUrl().then(async (url) =>
          this.createIframe(url)
        )
      }
    }
    return this._connection
  }
}
