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
import type { ChattyHost, ChattyHostBuilder } from '@looker/chatty'
import type {
  CookielessRequestInit,
  EnvClientDialogEvent,
  LookerEmbedCookielessSessionData,
  PagePropertiesChangedEvent,
} from '../types'
import { IS_URL } from '../utils'
import type { EmbedBuilderEx } from './EmbedBuilderEx'
import type { LookerEmbedExSDK } from './LookerEmbedExSDK'
import { EmbedConnection } from './EmbedConnection'
import type { IEmbedClient, ILookerConnection } from './types'

export class EmbedClientEx implements IEmbedClient {
  _hostBuilder: ChattyHostBuilder | null = null
  _host: ChattyHost | null = null
  _connection: Promise<EmbedConnection> | null = null
  _client: EmbedConnection | null = null
  _cookielessInitialized = false
  _cookielessApiToken?: string | null
  _cookielessApiTokenTtl?: number | null
  _cookielessNavigationToken?: string | null
  _cookielessNavigationTokenTtl?: number | null
  _cookielessSessionReferenceTokenTtl?: number | null
  _pageChangeResolver?: (
    value: EmbedConnection | PromiseLike<EmbedConnection>
  ) => void

  /**
   * @hidden
   */

  constructor(
    private _sdk: LookerEmbedExSDK,
    private _builder: EmbedBuilderEx
  ) {}

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

  private async createIframe(url: string, waitUntilLoaded: boolean) {
    this._hostBuilder = this._sdk.chattyHostCreator(url)
    if (!this._builder.handlers['page:changed']) {
      this._builder.handlers['page:changed'] = []
    }
    this._builder.handlers['page:changed'].push(() => {
      if (this._pageChangeResolver) {
        const resolve = this._pageChangeResolver
        this._pageChangeResolver = undefined
        resolve(this._client as EmbedConnection)
      }
    })
    if (this._builder.dialogScroll) {
      if (!this._builder.handlers['env:client:dialog']) {
        this._builder.handlers['env:client:dialog'] = []
      }
      this._builder.handlers['env:client:dialog'].push(
        ({ open, placement }: EnvClientDialogEvent) => {
          // Placement of 'cover' means that the dialog top is close
          // to the top of the IFRAME. The top MAY be scrolled out
          // of view. The following attempts to scroll the top of the
          // dialog into view.
          if (open && placement === 'cover') {
            // Timeout is a little ugly. Suspect there might be an issue
            // with a Looker component where the last row is scrolled
            // into view. Normally not an issue because outside of embed
            // as the dialog is limited to the viewport.
            // Make timeout configurable?
            window.setTimeout(() => {
              if (this._host) {
                this._host.iframe.scrollIntoView(true)
              }
            }, 200)
          }
        }
      )
    }
    if (this._builder.dynamicIFrameHeight) {
      if (!this._builder.handlers['page:properties:changed']) {
        this._builder.handlers['page:properties:changed'] = []
      }
      this._builder.handlers['page:properties:changed'].push(
        ({ height }: PagePropertiesChangedEvent) => {
          if (height && height > 100 && this._host) {
            this._host.iframe.style.height = `${height}px`
          }
        }
      )
    }
    if (this._builder.isCookielessEmbed) {
      if (!this._builder.handlers['session:tokens:request']) {
        this._builder.handlers['session:tokens:request'] = []
      }
      this._builder.handlers['session:tokens:request'].push(async () => {
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
          this._client.send('session:tokens', {
            api_token: this._cookielessApiToken,
            api_token_ttl: this._cookielessApiTokenTtl,
            navigation_token: this._cookielessNavigationToken,
            navigation_token_ttl: this._cookielessNavigationTokenTtl,
            session_reference_token_ttl:
              this._cookielessSessionReferenceTokenTtl,
          })
        }
      })
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
    for (const attr of this._builder.allowAttrs) {
      this._hostBuilder.withAllowAttribute(attr)
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

    if (this._builder.scrollMonitor) {
      this.addIframeMonitor(this._host.iframe)
    }

    const connectPromise = this._host.connect().then((host) => {
      this._client = new EmbedConnection(host, this)
      return this._client
    })

    if (waitUntilLoaded) {
      return new Promise<EmbedConnection>((resolve) => {
        this._pageChangeResolver = resolve
      })
    }

    return connectPromise
  }

  private sendScrollData(iframe: HTMLIFrameElement) {
    if (this._client) {
      this._client.send('env:host:scroll', {
        offsetLeft: iframe.offsetLeft,
        offsetTop: iframe.offsetTop,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      })
    }
  }

  private addIframeMonitor(iframe: HTMLIFrameElement) {
    document.addEventListener('scroll', (_event: Event) => {
      this.sendScrollData(iframe)
    })
    window.addEventListener('resize', (_event: Event) => {
      this.sendScrollData(iframe)
    })
  }

  private async createUrl() {
    const src = this.appendRequiredParameters(this._builder.embedUrl)
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
    if (this._sdk._sessionAcquired) {
      return this.acquireCookielessEmbedSessionInternal()
    }
    if (this._sdk._acquireSessionPromise) {
      await this._sdk._acquireSessionPromise
      return this.acquireCookielessEmbedSessionInternal()
    }
    this._sdk._acquireSessionPromise =
      this.acquireCookielessEmbedSessionInternal()
    return this._sdk._acquireSessionPromise
      .then((url) => {
        this._sdk._sessionAcquired = true
        return url
      })
      .catch((error) => {
        this._sdk._acquireSessionPromise = undefined
        throw error
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
    const src = `${this.appendRequiredParameters(
      this._builder.embedUrl
    )}&embed_navigation_token=${navigation_token}`
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

  async connect(waitUntilLoaded = false): Promise<ILookerConnection> {
    if (this._connection) return this._connection

    if (
      this._builder.url &&
      !this._builder.auth &&
      !this._builder.isCookielessEmbed
    ) {
      // Private embedding
      this._connection = this.createIframe(
        this.appendRequiredParameters(this._builder.url),
        waitUntilLoaded
      )
    } else {
      if (this._builder.isCookielessEmbed) {
        // Cookieless embedding
        this._connection = this.acquireCookielessEmbedSession()
          .then(async (url) => this.createIframe(url, waitUntilLoaded))
          .catch((_error) => {
            this._connection = null
            throw _error
          })
      } else {
        // Signed
        this._connection = this.createUrl().then(async (url) =>
          this.createIframe(url, waitUntilLoaded)
        )
      }
    }
    return this._connection
  }

  appendRequiredParameters(urlString: string): string {
    let requiredParams: Record<string, string>
    if (this._builder.sandboxedHost) {
      requiredParams = {
        embed_domain: this._sdk.apiHost,
        sandboxed_host: 'true',
        sdk: '2',
      }
    } else {
      const embedDomain = window.location.origin
      requiredParams = {
        embed_domain: embedDomain,
        sdk: '2',
      }
    }
    const tempOrigin = urlString.startsWith('https://') ? '' : 'http://abc'
    const url = new URL(`${tempOrigin}${urlString}`)
    for (const key in requiredParams) {
      if (!url.searchParams.has(key)) {
        url.searchParams.append(key, requiredParams[key])
      }
    }
    return tempOrigin
      ? url.toString().replace('http://abc', '')
      : url.toString()
  }
}
