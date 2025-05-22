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
  PageChangedEvent,
  PagePropertiesChangedEvent,
  SessionStatus,
  IEmbedClient,
  ILookerConnection,
  IConnectOptions,
} from './types'
import { IS_URL, extractPageTypeFromUrl } from './utils'
import type { EmbedBuilderEx } from './EmbedBuilderEx'
import type { LookerEmbedExSDK } from './LookerEmbedExSDK'
import { EmbedConnection } from './EmbedConnection'

export class EmbedClientEx implements IEmbedClient {
  _hostBuilder?: ChattyHostBuilder
  _host?: ChattyHost
  _connectionPromise?: Promise<EmbedConnection>
  _connection?: EmbedConnection
  _client?: EmbedConnection
  _pageChangeResolver?: (
    value: EmbedConnection | PromiseLike<EmbedConnection>
  ) => void

  _lookerVersion?: number
  _cookielessInitialized = false
  _cookielessSessionExpired = false
  _hasSessionExpired = false

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

  /**
   * Target origin for messages
   */

  get targetOrigin() {
    if (this._builder.sandboxedHost) {
      return '*'
    }
    const apiHost = this._builder.apiHost
    return IS_URL.test(apiHost) ? apiHost : `https://${apiHost}`
  }

  /**
   * Indicates in the page:load event is supported by the version of Looker being embedded
   */

  get isPageLoadEventSupported() {
    return this._lookerVersion !== undefined && this._lookerVersion >= 25.1
  }

  /**
   * Establish two way communication with embedded content. Returns a promise that resolves to a
   * client that can be used to send messages to the embedded content.
   */
  async connect(options?: IConnectOptions): Promise<ILookerConnection> {
    return this.connectInternal(options).then((connection) => {
      this._connection = connection as EmbedConnection
      return connection
    })
  }

  appendRequiredParameters(urlString: string): string {
    let requiredParams: Record<string, string>
    if (this._builder.sandboxedHost) {
      // Sandboxed host is set when the origin is null which is the legacy
      // extension framework loader. Typically, the extension framework
      // prefixes the apiHost with 'https://'. This is incorrect but it
      // works as the extension framework private embeds. Anyway, handle it
      // being there or not.
      const prefix = this._sdk.apiHost.startsWith('https://') ? '' : 'https://'
      requiredParams = {
        embed_domain: `${prefix}${this._sdk.apiHost}`,
        sandboxed_host: 'true',
        sdk: '3',
      }
    } else {
      const embedDomain = window.location.origin
      requiredParams = {
        embed_domain: embedDomain,
        sdk: '3',
      }
    }
    if (this._builder.allowLoginScreen && !this._builder.sandboxedHost) {
      requiredParams.allow_login_screen = 'true'
    }
    const tempOrigin = urlString.startsWith('https://') ? '' : 'http://abc'
    const url = new URL(`${tempOrigin}${urlString}`)
    const replaceEmbedDomain = !url.searchParams.has('embed_domain')
    for (const key in requiredParams) {
      if (!url.searchParams.has(key)) {
        url.searchParams.append(key, requiredParams[key])
      }
    }
    let embedString = url.toString()
    // For backwards compatibility unencode embed domain
    if (replaceEmbedDomain) {
      embedString = embedString.replace(
        `embed_domain=${encodeURIComponent(requiredParams.embed_domain)}`,
        `embed_domain=${requiredParams.embed_domain}`
      )
    }
    if (tempOrigin) {
      embedString = embedString.replace('http://abc', '')
    }
    return embedString
  }

  private async connectInternal(
    options: IConnectOptions = {}
  ): Promise<ILookerConnection> {
    if (this._connectionPromise) return this._connectionPromise
    if (!this._builder.auth?.url && !this._builder.isCookielessEmbed) {
      // Private embedding
      this._connectionPromise = this.abortableCreateIframe(
        this.prependApiHost(
          this.appendRequiredParameters(this._builder.embedUrl)
        ),
        options
      )
    } else {
      if (this._builder.isCookielessEmbed) {
        // Cookieless embedding
        this._connectionPromise = this.acquireCookielessEmbedSession(options)
          .then(async (url) => this.abortableCreateIframe(url, options))
          .catch((_error) => {
            this._connectionPromise = undefined
            throw _error
          })
      } else {
        // Signed
        this._connectionPromise = this.abortableCreateSignedUrl(options).then(
          async (url) => this.abortableCreateIframe(url, options)
        )
      }
    }
    return this._connectionPromise
  }

  private prependApiHost(url: string) {
    return `https://${this._sdk.apiHost}${url}`
  }

  private updateEditing(isEditing: boolean) {
    if (this._connection) {
      this._connection._isEditing = isEditing
    }
  }

  private async abortableCreateIframe(
    url: string,
    { waitUntilLoaded, signal }: IConnectOptions
  ): Promise<EmbedConnection> {
    return new Promise((resolve, reject) => {
      let promiseAborted = false
      const abortHandler = () => {
        this._sdk._createEmbedSessionPromise = undefined
        promiseAborted = true
        reject(signal?.reason)
      }
      if (waitUntilLoaded && signal) {
        signal.addEventListener('abort', abortHandler)
      }
      this.createIframe(url, waitUntilLoaded)
        .then((connection) => {
          signal?.removeEventListener('abort', abortHandler)
          if (!promiseAborted) {
            this._sdk._sessionCreated = true
            resolve(connection)
          }
        })
        .catch((error) => {
          signal?.removeEventListener('abort', abortHandler)
          if (!promiseAborted) {
            this._sdk._createEmbedSessionPromise = undefined
            reject(error)
          }
        })
    })
  }

  private async createIframe(url: string, waitUntilLoaded?: boolean) {
    this._hostBuilder = this._sdk.chattyHostCreator(url)
    if (!this._builder.handlers['session:expired']) {
      this._builder.handlers['session:expired'] = []
    }
    this._builder.handlers['session:expired'].push(() => {
      this._hasSessionExpired = true
      this._sdk.clearSession()
    })
    if (!this._builder.handlers['page:changed']) {
      this._builder.handlers['page:changed'] = []
    }
    this._builder.handlers['page:changed'].push((event: PageChangedEvent) => {
      if (this._connection) {
        const pathname = (event?.page?.url || '').split('?')[0]
        if (pathname !== this._connection._currentPathname) {
          this._connection._currentPathname = pathname
          if (this._connection.isEditing()) {
            this.updateEditing(false)
          }
          this.identifyPageType(event)
        }
      }
      this.parseLookerVersion(event?.page?.lookerVersion)
      if (this._pageChangeResolver) {
        const resolve = this._pageChangeResolver
        this._pageChangeResolver = undefined
        resolve(this._client as EmbedConnection)
      }
    })
    if (!this._builder.handlers['dashboard:edit:start']) {
      this._builder.handlers['dashboard:edit:start'] = []
    }
    this._builder.handlers['dashboard:edit:start'].push(() =>
      this.updateEditing(true)
    )
    if (!this._builder.handlers['dashboard:edit:cancel']) {
      this._builder.handlers['dashboard:edit:cancel'] = []
    }
    this._builder.handlers['dashboard:edit:cancel'].push(() =>
      this.updateEditing(false)
    )
    if (!this._builder.handlers['dashboard:save:complete']) {
      this._builder.handlers['dashboard:save:complete'] = []
    }
    this._builder.handlers['dashboard:save:complete'].push(() =>
      this.updateEditing(false)
    )
    if (!this._builder.handlers['look:edit:start']) {
      this._builder.handlers['look:edit:start'] = []
    }
    this._builder.handlers['look:edit:start'].push(() =>
      this.updateEditing(true)
    )
    if (!this._builder.handlers['look:edit:cancel']) {
      this._builder.handlers['look:edit:cancel'] = []
    }
    this._builder.handlers['look:edit:cancel'].push(() =>
      this.updateEditing(false)
    )
    if (!this._builder.handlers['look:save:complete']) {
      this._builder.handlers['look:save:complete'] = []
    }
    this._builder.handlers['look:save:complete'].push(() =>
      this.updateEditing(false)
    )
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
      if (!this._builder.handlers['session:status']) {
        this._builder.handlers['session:status'] = []
      }
      this._builder.handlers['session:status'].push((event: SessionStatus) => {
        if (event?.expired) {
          this._cookielessSessionExpired = true
        }
      })
      if (!this._builder.handlers['session:tokens:request']) {
        this._builder.handlers['session:tokens:request'] = []
      }
      this._builder.handlers['session:tokens:request'].push(async () => {
        const cookielessSession = this._sdk._cookielessSession
        // Make typescript happy. This should not happen
        if (!cookielessSession || !this._client) {
          throw new Error('Invalid state')
        }
        let updateGenerateTokensTime =
          cookielessSession.generateTokensTime === 0
        if (!this._cookielessSessionExpired) {
          if (this._cookielessInitialized) {
            if (Date.now() > cookielessSession.generateTokensTime) {
              updateGenerateTokensTime = true
              try {
                const {
                  api_token,
                  api_token_ttl,
                  navigation_token,
                  navigation_token_ttl,
                  session_reference_token_ttl,
                } = await this.generateTokens()
                if (
                  session_reference_token_ttl === 0 ||
                  (api_token &&
                    Number(api_token_ttl) > 0 &&
                    navigation_token &&
                    Number(navigation_token_ttl) > 0 &&
                    typeof session_reference_token_ttl === 'number')
                ) {
                  // Valid looking tokens
                  cookielessSession.cookielessApiToken = api_token
                  cookielessSession.cookielessApiTokenTtl = api_token_ttl
                  cookielessSession.cookielessNavigationToken = navigation_token
                  cookielessSession.cookielessNavigationTokenTtl =
                    navigation_token_ttl
                  cookielessSession.cookielessSessionReferenceTokenTtl =
                    session_reference_token_ttl
                } else {
                  // cookielessSessionReferenceTokenTtl of null means we did not
                  // get valid tokens
                  cookielessSession.cookielessSessionReferenceTokenTtl = null
                }
              } catch (error) {
                // cookielessSessionReferenceTokenTtl of null means we did not
                // get valid tokens
                cookielessSession.cookielessSessionReferenceTokenTtl = null
              }
            }
          } else {
            // Perhaps mark as initialized. If cookielessSessionReferenceTokenTtl is
            // not a mumber the acquire session failed.
            this._cookielessInitialized =
              !!cookielessSession.cookielessSessionReferenceTokenTtl
          }
        }

        // We did not get valid tokens. Looker will display interrupted screen
        if (
          typeof cookielessSession.cookielessSessionReferenceTokenTtl !==
          'number'
        ) {
          this._client.send('session:tokens', {
            api_token: undefined,
            api_token_ttl: undefined,
            navigation_token: undefined,
            navigation_token_ttl: undefined,
            session_reference_token_ttl: undefined,
          })
          return
        }

        // Session has expired. Need to send valid tokens for backwards
        // compatibility
        if (cookielessSession.cookielessSessionReferenceTokenTtl === 0) {
          this._client.send('session:tokens', {
            api_token: 'session expired',
            api_token_ttl: 240,
            navigation_token: 'session expired',
            navigation_token_ttl: 240,
            session_reference_token_ttl: 0,
          })
          return
        }

        if (updateGenerateTokensTime) {
          // At this point we have valid tokens. Use the same tokens until
          // 2 minutes before expiry time. This prevents multiple IFRAMEs
          // from hammering the generate token endpoint
          if (cookielessSession.cookielessSessionReferenceTokenTtl === 0) {
            this._cookielessSessionExpired = true
            cookielessSession.generateTokensTime = 0
          } else {
            let newGenerateTokensTime = Date.now()
            const {
              cookielessSessionReferenceTokenTtl,
              cookielessApiTokenTtl,
              cookielessNavigationTokenTtl,
            } = cookielessSession
            const ttl = Math.min(
              cookielessSessionReferenceTokenTtl,
              Number(cookielessApiTokenTtl),
              Number(cookielessNavigationTokenTtl)
            )
            if (ttl < 60) {
              newGenerateTokensTime = Date.now()
            } else if (ttl < 120) {
              newGenerateTokensTime = Date.now() + 60 * 1000
            } else {
              newGenerateTokensTime = Date.now() + (ttl - 120) * 1000
            }
            cookielessSession.generateTokensTime = newGenerateTokensTime
          }
        }

        // Send good tokens
        this._client.send('session:tokens', {
          api_token: cookielessSession.cookielessApiToken,
          api_token_ttl: cookielessSession.cookielessApiTokenTtl,
          navigation_token: cookielessSession.cookielessNavigationToken,
          navigation_token_ttl: cookielessSession.cookielessNavigationTokenTtl,
          session_reference_token_ttl:
            cookielessSession.cookielessSessionReferenceTokenTtl,
        })

        // Clear the generateTokensPromise. All IFRAMEs will queue up
        // on the same promise
        this._sdk._generateTokensPromise = undefined
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
      .withAriaLabel(this._builder.ariaLabel)
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
      if (this._sdk._createEmbedSessionPromiseResolver) {
        // Resolve the create session promise now that the IFRAME
        // has been loaded.
        this._sdk._sessionCreated = true
        const resolver = this._sdk._createEmbedSessionPromiseResolver
        this._sdk._createEmbedSessionPromiseResolver = undefined
        // An empty string is used because the same resolver is
        // used for cookieless which does return a url. Signed url
        // will use the bare url which is available to the promise
        // resolution listener.
        resolver('')
      }
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

  private abortableCreateSignedUrl({
    waitUntilLoaded,
    signal,
  }: IConnectOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      let promiseAborted = false
      const abortHandler = () => {
        this._sdk._createEmbedSessionPromise = undefined
        promiseAborted = true
        reject(signal?.reason)
      }
      if (waitUntilLoaded && signal) {
        signal.addEventListener('abort', abortHandler)
      }
      this.createSignedUrl()
        .then((url) => {
          signal?.removeEventListener('abort', abortHandler)
          if (!promiseAborted) {
            resolve(url)
          }
        })
        .catch((error) => {
          signal?.removeEventListener('abort', abortHandler)
          if (!promiseAborted) {
            this._sdk._createEmbedSessionPromise = undefined
            reject(error)
          }
        })
    })
  }

  private async createSignedUrl() {
    const src = this.appendRequiredParameters(this._builder.embedUrl)
    // If the session exists there is no need to go though
    // the signing process again so the naked url is used
    // (prepended by the host).
    if (this._sdk._sessionCreated) {
      return Promise.resolve(this.prependApiHost(src))
    }

    if (this._sdk._createEmbedSessionPromise) {
      // Wait for the session to be created and then use
      // the naked url prepended by the host
      await this._sdk._createEmbedSessionPromise
      return Promise.resolve(this.prependApiHost(src))
    }

    // Create the session acquire promise and make the resolve
    // available. The promise will be resolved once the IFRAME
    // has been created. The auth promise cannot be used as all
    // it does is create the embed login url. The session does
    // not exist until the IFRAME is loaded.
    this._sdk._createEmbedSessionPromise = new Promise<string>((resolve) => {
      this._sdk._createEmbedSessionPromiseResolver = resolve
    })

    const auth = this._builder.auth

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

  private async acquireCookielessEmbedSession(
    options: IConnectOptions
  ): Promise<string> {
    if (this._sdk._sessionCreated) {
      if (this._sdk._cookielessSession?.cookielessNavigationToken) {
        return this.getCookielessEmbedUrl()
      }
      return this.abortableAcquireCookielessEmbedSessionInternal(options)
    }
    if (this._sdk._createEmbedSessionPromise) {
      await this._sdk._createEmbedSessionPromise
      if (this._sdk._cookielessSession?.cookielessNavigationToken) {
        return this.getCookielessEmbedUrl()
      }
      return this.abortableAcquireCookielessEmbedSessionInternal(options)
    }

    // Create the session acquire promise and make the resolve
    // available. The promise will be resolved once the IFRAME
    // has been created. The auth promise cannot be used as all
    // it does is create the embed login url. The session does
    // not exist until the IFRAME is loaded.
    this._sdk._createEmbedSessionPromise = new Promise<string>((resolve) => {
      this._sdk._createEmbedSessionPromiseResolver = resolve
    })

    return this.abortableAcquireCookielessEmbedSessionInternal(options)
  }

  private abortableAcquireCookielessEmbedSessionInternal({
    waitUntilLoaded,
    signal,
  }: IConnectOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      let promiseAborted = false
      const abortHandler = () => {
        this._sdk._createEmbedSessionPromise = undefined
        promiseAborted = true
        reject(signal?.reason)
      }
      if (waitUntilLoaded && signal) {
        signal.addEventListener('abort', abortHandler)
      }
      this.acquireCookielessEmbedSessionInternal()
        .then((url) => {
          signal?.removeEventListener('abort', abortHandler)
          if (!promiseAborted) {
            this._sdk._sessionCreated = true
            resolve(url)
          }
        })
        .catch((error) => {
          signal?.removeEventListener('abort', abortHandler)
          if (!promiseAborted) {
            this._sdk._createEmbedSessionPromise = undefined
            reject(error)
          }
        })
    })
  }

  private async acquireCookielessEmbedSessionInternal(): Promise<string> {
    const tokens = await this.acquireSession()
    const {
      authentication_token,
      api_token,
      api_token_ttl,
      navigation_token,
      navigation_token_ttl,
      session_reference_token_ttl,
    } = tokens
    if (
      !authentication_token ||
      !navigation_token ||
      typeof navigation_token_ttl !== 'number' ||
      !api_token ||
      typeof api_token_ttl !== 'number' ||
      typeof session_reference_token_ttl !== 'number'
    ) {
      throw new Error('failed to prepare cookieless embed session')
    }
    if (this._sdk._cookielessSession) {
      const cookielessSession = this._sdk._cookielessSession
      cookielessSession.cookielessApiToken = api_token
      cookielessSession.cookielessApiTokenTtl = api_token_ttl
      cookielessSession.cookielessNavigationToken = navigation_token
      cookielessSession.cookielessNavigationTokenTtl = navigation_token_ttl
      cookielessSession.cookielessSessionReferenceTokenTtl =
        session_reference_token_ttl
    }
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

  private getCookielessEmbedUrl() {
    const apiHost = `https://${this._builder.apiHost}`
    const embedPath = `${this.appendRequiredParameters(
      this._builder.embedUrl
    )}&embed_navigation_token=${
      this._sdk._cookielessSession?.cookielessNavigationToken || ''
    }`
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

  private generateTokens(): Promise<LookerEmbedCookielessSessionData> {
    if (this._sdk._generateTokensPromise) {
      return this._sdk._generateTokensPromise
    }
    if (!this._sdk._cookielessSession) {
      // This should never happen. Added to make typescript happy
      throw new Error(
        'Invalid state. generateTokens called but cookielessSession not present'
      )
    }
    const {
      cookielessApiToken,
      cookielessApiTokenTtl,
      cookielessNavigationToken,
      cookielessNavigationTokenTtl,
      cookielessSessionReferenceTokenTtl,
    } = this._sdk._cookielessSession
    const { generateTokens } = this._builder
    if (typeof generateTokens === 'function') {
      this._sdk._generateTokensPromise = generateTokens({
        api_token: cookielessApiToken,
        api_token_ttl: cookielessApiTokenTtl,
        navigation_token: cookielessNavigationToken,
        navigation_token_ttl: cookielessNavigationTokenTtl,
        session_reference_token_ttl: cookielessSessionReferenceTokenTtl,
      })
      return this._sdk._generateTokensPromise
    }
    const { url, init: defaultInit } = this.getResource(
      generateTokens as string | CookielessRequestInit
    )

    const init = defaultInit
      ? {
          headers: {
            'content-type': 'application/json',
          },
          method: 'PUT',
          ...defaultInit,
          body: JSON.stringify({
            api_token: cookielessApiToken,
            navigation_token: cookielessNavigationToken,
          }),
        }
      : {
          body: JSON.stringify({
            api_token: cookielessApiToken,
            navigation_token: cookielessNavigationToken,
          }),
          headers: {
            'content-type': 'application/json',
          },
          method: 'PUT',
        }

    this._sdk._generateTokensPromise = fetch(url, init).then((resp) => {
      if (resp.ok) {
        return resp.json()
      } else {
        throw new Error('Failed to generate tokens')
      }
    })

    return this._sdk._generateTokensPromise
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

  private identifyPageType(event: PageChangedEvent) {
    if (this._connection) {
      this._connection._pageType = extractPageTypeFromUrl(
        event?.page?.url || ''
      )
    }
  }

  private parseLookerVersion(lookerVersion?: string) {
    if (lookerVersion && typeof this._lookerVersion !== 'number') {
      const [majorVersionString, minorVersionString] = lookerVersion.split('.')
      const version = parseFloat(`${majorVersionString}.${minorVersionString}`)
      if (!Number.isNaN(version)) {
        this._lookerVersion = version
      }
    }
  }
}
