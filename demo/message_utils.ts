/*

 MIT License

 Copyright (c) 2022 Looker Data Sciences, Inc.

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
import type { LookerEmbedCookielessSessionData } from '../src'

/**
 * The content of this file provides utilities that demonstrate
 * the use of Looker embeddingwith `windows.postMessage`. It only
 * supports SSO embed or cookieless embed.
 */

export interface EmbedFrame {
  /**
   * Connect the embedded Looker application
   */
  connect(): Promise<EmbedFrame>
  /**
   * Add listener for embed message (multiple messages for a single
   * message type are supported).
   */
  on: (messageType: string, handler: EmbedMessageHandler) => EmbedFrame
  /**
   * Remove listener for embed message
   */
  off: (messageType: string, handler: EmbedMessageHandler) => EmbedFrame
  /**
   * Send a message to the embedded Looker application
   */
  send: (messageType: string, data?: any) => EmbedFrame
}

/**
 * Handler interface for messages received from embedded Looker application.
 */
type EmbedMessageHandler = (data: any) => void

/**
 * Tokens required to create a frame.
 */
interface CreateFrameTokens {
  authentication_token: string
  navigation_token: string
}

/**
 * Tokens required by the embedded Looker applications to function.
 */
interface ApplicationTokens {
  api_token: string
  api_token_ttl: number
  navigation_token: string
  navigation_token_ttl: number
  session_reference_token_ttl: number
}

// TODO consider creating two environment types, one for SSO, one for
// cookieless.

/**
 * Embed environment. Either SSO or Cookieless
 */
class EmbedEnvironmentTypeImpl {
  apiHost?: string
  auth?: string
  private acquireSessionCallback?: () => Promise<LookerEmbedCookielessSessionData>
  private generateTokensCallback?: () => Promise<LookerEmbedCookielessSessionData>
  private sessionData?: LookerEmbedCookielessSessionData
  private initialSessionPromise?: Promise<LookerEmbedCookielessSessionData>

  /**
   * Return true if the embed environment is initialized.
   */
  get isInitialized() {
    return !!this.apiHost
  }

  /**
   * Return true if cookieless embed is being used. If false SSO is being used.
   * This will throw an error if the embed environment is not initialized.
   */
  get isCookielessEmbed() {
    if (!this.isInitialized) {
      throw new Error('embed environment not initialized')
    }
    return !!this.acquireSessionCallback
  }

  /**
   * Get application tokens. Tokens that are required for the embedded Looker
   * application to run. These are short lived tokens that need to be generated
   * on a regular basis.
   */
  get applicationTokens(): ApplicationTokens | undefined {
    if (this.sessionData) {
      const {
        api_token,
        api_token_ttl,
        navigation_token,
        navigation_token_ttl,
        session_reference_token_ttl,
      } = this.sessionData || {}
      return {
        api_token: api_token!,
        api_token_ttl: api_token_ttl!,
        navigation_token: navigation_token!,
        navigation_token_ttl: navigation_token_ttl!,
        session_reference_token_ttl: session_reference_token_ttl!,
      }
    }
    return undefined
  }

  /**
   * Initialize embed to use SSO.
   */
  initSSO(apiHost: string, auth: string) {
    this.apiHost = apiHost
    this.auth = auth
    this.acquireSessionCallback = undefined
    this.generateTokensCallback = undefined
  }

  /**
   * Initialize cookieless embed.
   */
  initCookieless(
    apiHost: string,
    acquireSessionCallback: () => Promise<LookerEmbedCookielessSessionData>,
    generateTokensCallback: () => Promise<LookerEmbedCookielessSessionData>
  ) {
    this.apiHost = apiHost
    this.auth = undefined
    this.acquireSessionCallback = acquireSessionCallback
    this.generateTokensCallback = generateTokensCallback
  }

  /**
   * Acquire a cookieless embed session.
   */
  async acquireSession(): Promise<CreateFrameTokens> {
    if (this.isCookielessEmbed) {
      return this.acquireCookielessSession()
    } else {
      throw new Error('embed not initialized to use cookieless embed')
    }
  }

  /**
   * Generate tokens for a cookieless embed session.
   */
  async generateTokens(): Promise<ApplicationTokens> {
    if (this.isCookielessEmbed) {
      const sessionData = await this.generateTokensCallback!()
      this.sessionData = sessionData
      return this.applicationTokens!
    } else {
      throw new Error('embed not initialized to use cookieless embed')
    }
  }

  /**
   * Sign URL
   */
  async signUrl(_url: string): Promise<string> {
    if (!this.isCookielessEmbed) {
      throw new Error('signUrl not implemented')
    } else {
      throw new Error('embed not initialized to use embed SSO')
    }
  }

  /**
   * The following handles complications that can occur when multiple
   * IFRAMES are created when a page loads. All the IFRAMES need to join the same
   * session and authentication tokens can only be used once.
   *
   * For all the IFRAMEs to join the same session, at least one call to the
   * acquireSessionCallback must complete. This means all IFRAMEs must wait
   * for the first call to complete.
   *
   * For authentication tokens to only be used once, on the initial call only
   * the first IFRAME can used that token. Other frames may then safely call the
   * acquireSessionCallback to get their own authentication token.
   */
  private async acquireCookielessSession(): Promise<CreateFrameTokens> {
    if (!this.sessionData) {
      if (!this.initialSessionPromise) {
        try {
          // Processing for the very first IFRAME.
          this.initialSessionPromise = this.acquireSessionCallback!()
          const sessionData = await this.initialSessionPromise
          const { authentication_token, navigation_token } = sessionData
          this.sessionData = sessionData
          this.initialSessionPromise = undefined
          if (authentication_token && navigation_token) {
            return { authentication_token, navigation_token }
          }
          throw new Error(
            `acquireSessionCallback failed to return valid tokens: ${JSON.stringify(
              sessionData
            )}`
          )
        } catch (error) {
          this.initialSessionPromise = undefined
          this.sessionData = undefined
          throw error
        }
      }
      // IFRAMEs waiting for first IFRAME to finish
      this.sessionData = await this.initialSessionPromise
    }
    // IFRAMEs now get the their own authentication token.
    const sessionData = await this.acquireSessionCallback!()
    const { authentication_token, navigation_token } = sessionData
    this.sessionData = sessionData
    if (authentication_token && navigation_token) {
      return { authentication_token, navigation_token }
    }
    throw new Error(
      `acquireSessionCallback failed to return valid tokens: ${JSON.stringify(
        sessionData
      )}`
    )
  }
}

// TODO consider creating two frame types, one for SSO, one for
// cookieless.

/**
 * Embed frame class. There is a one to one mapping between and embed
 * IFRAME and an EmbedFrame.
 */
class EmbedFrameImpl implements EmbedFrame {
  private connected = false
  private eventHandlerMap = new Map<string, ((data: any) => void)[]>()
  private get frameOrigin() {
    return `https://${this.embedEnvironment.apiHost}`
  }

  constructor(
    private embedEnvironment: EmbedEnvironmentTypeImpl,
    public readonly iframeId: string,
    public readonly embedUrl: string,
    public readonly parentElementId?: string,
    public readonly className?: string,
    // Demo code for testing error conditions. NOT REQUIRED for production applications.
    private recoverableError?: boolean
  ) {
    const element = document.getElementById(iframeId)
    if (parentElementId) {
      const parentElement = document.getElementById(parentElementId)
      if (!parentElement) {
        throw new Error(
          `element for parentElementId not found: ${parentElementId}`
        )
      }
      if (element) {
        throw new Error(
          `When parentElementId is used the IFRAME element must not exist: ${iframeId}`
        )
      }
    } else if (!element || element?.tagName.toUpperCase() !== 'IFRAME') {
      throw new Error(
        `When parentElementId is not used the IFRAME element must exist and be an IFRAME: ${iframeId}`
      )
    }
  }

  /**
   * Add listener for embed message (multiple messages for a single
   * message type are supported).
   */
  on(messageType: string, handler: EmbedMessageHandler) {
    if (!this.eventHandlerMap.has(messageType)) {
      this.eventHandlerMap.set(messageType, [])
    }
    this.eventHandlerMap.get(messageType)!.push(handler)
    return this
  }

  /**
   * Remove listener for embed message
   */
  off(messageType: string, handler: EmbedMessageHandler) {
    if (!this.eventHandlerMap.has(messageType)) {
      const handlers = this.eventHandlerMap
        .get(messageType)!
        .filter((_handler) => handler !== _handler)
      this.eventHandlerMap.set(messageType, handlers)
    }
    return this
  }

  /**
   * Send a message to the embedded Looker application
   */
  send(messageType: string, data: any = {}) {
    const contentWindow = this.getContentWindow()
    if (contentWindow) {
      const message: any = {
        type: messageType,
        ...data,
      }
      contentWindow.postMessage(JSON.stringify(message), this.frameOrigin)
    }
    return this
  }

  /**
   * Connect the embedded Looker application
   */
  async connect() {
    // Get the login URL
    let loginUrl: string
    if (this.embedEnvironment.isCookielessEmbed) {
      this.on(
        'session:tokens:request',
        this.sessionTokensRequestHandler.bind(this)
      )
      loginUrl = await this.getCookielessLoginUrl()
    } else {
      loginUrl = await this.getSSOLoginUrl()
    }
    if (this.parentElementId) {
      // Create a new IFRAME and append to parent element
      const iframeElement = document.createElement(
        'iframe'
      ) as HTMLIFrameElement
      iframeElement.src = loginUrl
      iframeElement.id = this.iframeId
      if (this.className) {
        iframeElement.className = this.className
      }
      // Automatically allow fullscreen display of visualizations
      iframeElement.allow = 'fullscreen'
      const parentElement = document.getElementById(
        this.parentElementId
      ) as Element
      parentElement.appendChild(iframeElement)
    } else {
      // Update src attribute of existing IFRAME.
      const element = document.getElementById(
        this.iframeId
      ) as HTMLIFrameElement
      if (this.className) {
        if (!element.classList.contains(this.className)) {
          element.classList.add(this.className)
        }
      }
      element.src = loginUrl
    }
    return this
  }

  /**
   * Destroy the IFRAME. This method is not directly exposed.
   */
  destroy() {
    const element = document.getElementById(this.iframeId) as HTMLIFrameElement
    if (this.parentElementId) {
      const parentElement = document.getElementById(
        this.parentElementId
      ) as Element
      parentElement.removeChild(element)
    } else {
      element.src = ''
      if (this.className) {
        if (element.classList.contains(this.className)) {
          element.classList.remove(this.className)
        }
      }
    }
  }

  /**
   * Route messages from IFRAMEs. The method is not directly exposed.
   */
  messageHandler(event: MessageEvent) {
    const contentWindow = this.getContentWindow()
    if (contentWindow && event.source === contentWindow) {
      if (event.origin === this.frameOrigin) {
        const { data } = event
        if (data) {
          let parsedData: any
          try {
            parsedData = typeof data === 'object' ? data : JSON.parse(data)
          } catch (error) {
            console.error('data is not json', { data })
          }
          if (parsedData) {
            const { type } = parsedData
            const fs = this.eventHandlerMap.get(type)
            if (fs) {
              fs.forEach((f) => f(parsedData))
            }
          }
        }
      }
    }
  }

  /**
   * Generate a cookieless login URL. Acquires the session and builds the
   * appropriate URL using the returned tokens.
   */
  private async getCookielessLoginUrl(): Promise<string> {
    const { authentication_token, navigation_token } =
      await this.embedEnvironment.acquireSession()
    const url = this.embedUrl.startsWith('/embed')
      ? this.embedUrl
      : `/embed${this.embedUrl}`
    const embedUrl = new URL(url, this.frameOrigin)
    if (!embedUrl.searchParams.has('embed_domain')) {
      embedUrl.searchParams.set('embed_domain', window.location.origin)
    }
    embedUrl.searchParams.set('embed_navigation_token', navigation_token)
    const targetUri = encodeURIComponent(
      `${embedUrl.pathname}${embedUrl.search}${embedUrl.hash}`
    )
    return `${embedUrl.origin}/login/embed/${targetUri}?embed_authentication_token=${authentication_token}`
  }

  /**
   * Generate a login URL for SSO. Note that this is a simplistic implementation
   * for demo purposes. The Embed SDK has far more functionality.
   */
  private async getSSOLoginUrl(): Promise<string> {
    const url = this.embedUrl.startsWith('/embed')
      ? this.embedUrl
      : `/embed${this.embedUrl}`
    const embedUrl = new URL(url, this.frameOrigin)
    if (!embedUrl.searchParams.has('embed_domain')) {
      embedUrl.searchParams.set('embed_domain', window.location.origin)
    }
    const src = encodeURIComponent(
      `${embedUrl.pathname}${embedUrl.search}${embedUrl.hash}`
    )
    const authUrl = `${this.embedEnvironment.auth}?src=${src}`
    const response = await fetch(authUrl)
    const body: any = await response.json()
    const signedUrl = body.url
    return signedUrl
  }

  private countTokenRequests = 0

  /**
   * Handler for token requests (cookieless embed only)
   */
  private async sessionTokensRequestHandler(_data: any) {
    const contentWindow = this.getContentWindow()
    if (contentWindow) {
      if (!this.connected) {
        // Demo code for testing error conditions. NOT REQUIRED for production applications.
        if (this.recoverableError) {
          this.countTokenRequests++
          if (this.countTokenRequests < 4) {
            return
          }
        }
        // When not connected the newly acquired tokens can be used.
        const sessionTokens = this.embedEnvironment.applicationTokens
        if (sessionTokens) {
          this.connected = true
          this.send('session:tokens', this.embedEnvironment.applicationTokens)
        }
      } else {
        // If connected, the embedded Looker application has decided that
        // it needs new tokens. Generate new tokens.
        const sessionTokens = await this.embedEnvironment.generateTokens()
        this.send('session:tokens', sessionTokens)
      }
    }
  }

  /**
   * Convienience method to get the IFRAME content window.
   */
  private getContentWindow() {
    const iframe = document.getElementById(this.iframeId)
    if (iframe) {
      return (iframe as HTMLIFrameElement).contentWindow
    }
    return undefined
  }
}

/**
 * Keep track of any frames that are created.
 */
const embedFrames = new Map<string, EmbedFrameImpl>()

/**
 * The embed environment. SSO or Cookieless embed.
 */
const embedEnvironment = new EmbedEnvironmentTypeImpl()

/**
 * Listen for messages and route to the frames.
 */
window.addEventListener('message', (event: MessageEvent) => {
  embedFrames.forEach((frame) => {
    frame.messageHandler(event)
  })
})

/**
 * SSO embed initialization
 */
export const initSSOEmbed = (apiHost: string, auth: string) => {
  if (embedEnvironment.isInitialized && embedEnvironment.isCookielessEmbed) {
    embedFrames.forEach((_, frameid) => {
      deleteEmbedFrame(frameid)
    })
  }
  embedEnvironment.initSSO(apiHost, auth)
}

/**
 * Cookieless embed initialization
 */
export const initCookielessEmbed = (
  apiHost: string,
  acquireSessionCallback: () => Promise<LookerEmbedCookielessSessionData>,
  generateTokensCallback: () => Promise<LookerEmbedCookielessSessionData>
) => {
  if (embedEnvironment.isInitialized && !embedEnvironment.isCookielessEmbed) {
    embedFrames.forEach((_, frameid) => {
      deleteEmbedFrame(frameid)
    })
  }
  embedEnvironment.initCookieless(
    apiHost,
    acquireSessionCallback,
    generateTokensCallback
  )
}

/**
 * Delete an embedded IFRAME.
 */
export const deleteEmbedFrame = (iframeId: string) => {
  if (embedFrames.has(iframeId)) {
    embedFrames.get(iframeId)!.destroy()
    embedFrames.delete(iframeId)
  }
}

/**
 * Add an embedded IFRAME.
 */
export const addEmbedFrame = (
  iframeId: string,
  embedUrl: string,
  parentElementId?: string,
  className?: string,
  // Demo code for testing error conditions. NOT REQUIRED for production applications.
  recoverableError?: boolean
): EmbedFrame => {
  if (embedFrames.has(iframeId)) {
    deleteEmbedFrame(iframeId)
  }
  const frame = new EmbedFrameImpl(
    embedEnvironment,
    iframeId,
    embedUrl,
    parentElementId,
    className,
    recoverableError
  )
  embedFrames.set(iframeId, frame)
  return frame
}

/**
 * Get an embedded IFRAME.
 */
export const getEmbedFrame = (ifameId: string): EmbedFrame =>
  embedFrames.get(ifameId) as EmbedFrame

/**
 * Returns the application tokens
 */
export const getApplicationTokens = () => {
  if (embedEnvironment.isInitialized && embedEnvironment.isCookielessEmbed) {
    return { ...embedEnvironment.applicationTokens }
  }
  return undefined
}
