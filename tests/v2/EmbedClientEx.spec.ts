/*

 MIT License

 Copyright (c) 2025 Looker Data Sciences, Inc.

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

import mock from 'xhr-mock'
import type { Callback, ChattyHostBuilder } from '@looker/chatty'
import type {
  CookielessCallback,
  CookielessRequestInit,
  GenerateTokensCallback,
  LookerAuthConfig,
  LookerEmbedCookielessSessionData,
  LookerEmbedCookielessTokenData,
} from '../../src/types'
import type { EmbedClientEx } from '../../src/v2/EmbedClientEx'
import type { EmbedBuilderEx } from '../../src/v2/EmbedBuilderEx'
import { LookerEmbedExSDK } from '../../src/v2/LookerEmbedExSDK'

const waitFor = (callback: () => boolean, options?: { timeout?: number }) =>
  new Promise<void>((resolve, reject) => {
    let count = 5
    setInterval(() => {
      count--
      if (callback()) {
        resolve()
      }
      if (count === 0) {
        reject(new Error('waitFor condition not met'))
      }
    }, options?.timeout)
  })

class MockChattyHostConnection {
  send() {
    // noop
  }
}

class MockChattyHost {
  _hostBuilder: MockHostBuilder
  _hostConnection?: MockChattyHostConnection
  iframe: HTMLIFrameElement = document.createElement('iframe')

  connect() {
    return new Promise((resolve) => {
      resolve(this._hostConnection)
    })
  }
}

class MockHostBuilder {
  _chattyHost?: MockChattyHost
  _url?: string
  _source?: string
  _frameBorder?: string
  _handlers: any[] = []
  _targetOrigin?: string
  _el: HTMLElement
  _sandboxAttributes: string[] = []
  _allowAttributes: string[] = []
  _classNames: string[] = []
  _scrollMonitor = false

  frameBorder(border: string) {
    this._frameBorder = border
    return this
  }

  on(name: string, callback: Callback) {
    this._handlers.push([name, callback])
    return this
  }

  withTargetOrigin(targetOrigin: string) {
    this._targetOrigin = targetOrigin
    return this
  }

  withSandboxAttribute(...attr: string[]) {
    this._sandboxAttributes = this._sandboxAttributes.concat(attr)
    return this
  }

  withAllowAttribute(...attr: string[]) {
    this._allowAttributes = this._allowAttributes.concat(attr)
    return this
  }

  withClassName(...classNames: string[]) {
    this._classNames = this._classNames.concat(classNames)
    return this
  }

  withScrollMonitor() {
    this._scrollMonitor = true
  }

  appendTo(el: HTMLElement) {
    this._el = el
    return this
  }

  build() {
    return this._chattyHost
  }

  countHandlersOfType(type) {
    return this._handlers.filter(([name]) => type === name).length
  }

  fireEventForHandler(name: string, event?: any) {
    this._handlers
      .filter(([handlerName]) => handlerName === name)
      .forEach(([_, callback]) => callback(event))
  }
}

describe('EmbedClientEx', () => {
  let mockChattyHostConnection: MockChattyHostConnection
  let mockChattyHost: MockChattyHost
  let mockHostBuilder: MockHostBuilder

  const getClient = (
    options: {
      sandboxedHost?: boolean
      apiHost?: string
      auth?: string | LookerAuthConfig
      acquireSession?: string | CookielessRequestInit | CookielessCallback
      generateTokens?: string | CookielessRequestInit | GenerateTokensCallback
    } = {}
  ) => {
    const {
      sandboxedHost = false,
      apiHost = 'myhost.com',
      auth,
      acquireSession,
      generateTokens,
    } = options
    const createChattyBuilder = (url: string) => {
      mockHostBuilder._url = url
      return mockHostBuilder as unknown as ChattyHostBuilder
    }
    const sdk = new LookerEmbedExSDK(createChattyBuilder)
    if (acquireSession && generateTokens) {
      sdk.initCookieless(apiHost, acquireSession, generateTokens)
    } else {
      sdk.init(apiHost, auth)
    }
    const builder = sdk
      .preload()
      .withDialogScroll()
      .withDynamicIFrameHeight()
      .withSandboxAttr('allow-popups')
      .withAllowAttr('allowfullscreen')
      .withClassName('myiframe-container')
      .withScrollMonitor() as EmbedBuilderEx
    builder.sandboxedHost = sandboxedHost
    return builder.build() as EmbedClientEx
  }

  beforeEach(() => {
    mock.setup()
    mockChattyHostConnection = new MockChattyHostConnection()
    mockChattyHost = new MockChattyHost()
    mockChattyHost._hostConnection = mockChattyHostConnection
    mockHostBuilder = new MockHostBuilder()
    mockHostBuilder._chattyHost = mockChattyHost
  })

  afterEach(() => mock.teardown())

  it('creates a private connection ', async () => {
    const client = getClient()
    await client.connect()
    expect(mockHostBuilder._url).toBe(
      '/embed/preload/?embed_domain=http%3A%2F%2Flocalhost%3A9876&sdk=2'
    )
    expect(mockHostBuilder.countHandlersOfType('session:tokens:request')).toBe(
      0
    )
    expect(mockHostBuilder.countHandlersOfType('page:changed')).toBe(1)
    expect(mockHostBuilder.countHandlersOfType('env:client:dialog')).toBe(1)
    expect(mockHostBuilder.countHandlersOfType('page:properties:changed')).toBe(
      1
    )
    expect(mockHostBuilder._sandboxAttributes).toEqual(['allow-popups'])
    expect(mockHostBuilder._allowAttributes).toEqual(['allowfullscreen'])
    expect(mockChattyHost.iframe.className).toBe('myiframe-container')
    expect(client.isConnected).toBeTruthy()
    expect(client.connection).toBeDefined()
  })

  it('creates a sandbox hosted private connection', async () => {
    const client = getClient({ sandboxedHost: true })
    await client.connect()
    expect(mockHostBuilder._url).toBe(
      '/embed/preload/?embed_domain=https%3A%2F%2Fmyhost.com&sandboxed_host=true&sdk=2'
    )
  })

  it('creates a sandbox hosted private connection simulating legacy extension framework', async () => {
    const client = getClient({
      apiHost: 'https://mylooker.com',
      sandboxedHost: true,
    })
    await client.connect()
    expect(mockHostBuilder._url).toBe(
      '/embed/preload/?embed_domain=https%3A%2F%2Fmylooker.com&sandboxed_host=true&sdk=2'
    )
  })

  it('creates a private connection simulating enhanced extension framework', async () => {
    const client = getClient({
      apiHost: 'https://mylooker.com',
    })
    await client.connect()
    expect(mockHostBuilder._url).toBe(
      '/embed/preload/?embed_domain=http%3A%2F%2Flocalhost%3A9876&sdk=2'
    )
  })

  it('creates a private connection and waits for a connection', async () => {
    const client = getClient({
      apiHost: 'https://mylooker.com',
    })
    const connectPromise = client.connect(true)
    expect(mockHostBuilder._url).toBe(
      '/embed/preload/?embed_domain=http%3A%2F%2Flocalhost%3A9876&sdk=2'
    )
    mockHostBuilder.fireEventForHandler('page:changed', {})
    await connectPromise
  })

  it('creates a signed url connection', async () => {
    const authResponse = {
      url: `https://mylooker.com/login/embed${encodeURIComponent(
        '/embed/preload/?embed_domain=http%3A%2F%2Flocalhost%3A9876&sdk=2'
      )}?external_user_id=postmanpat&signature=1234567890abcdef`,
    }
    mock.get(/\/auth\?src=/, (req, res) => {
      expect(req.url().toString()).toBe(
        '/auth?src=%2Fembed%2Fpreload%2F%3Fembed_domain%3Dhttp%253A%252F%252Flocalhost%253A9876%26sdk%3D2&param_1=value_1&param_2=value_2'
      )
      expect(req.header('Cache-Control')).toEqual('no-cache')
      expect(req.header('header_1')).toEqual('header_value_1')
      expect(req.header('header_2')).toEqual('header_value_2')
      return res.status(200).body(JSON.stringify(authResponse))
    })
    const client = getClient({
      auth: {
        headers: [
          { name: 'header_1', value: 'header_value_1' },
          { name: 'header_2', value: 'header_value_2' },
        ],
        params: [
          { name: 'param_1', value: 'value_1' },
          { name: 'param_2', value: 'value_2' },
        ],
        url: '/auth',
        withCredentials: true,
      },
    })
    await client.connect()
    expect(mockHostBuilder._url).toBe(authResponse.url)
  })

  it('handles a signed url request failure', async () => {
    mock.get(/\/auth\?src=/, (req, res) => {
      return res.status(429).reason('To many requests')
    })
    const client = getClient({
      auth: '/auth',
    })
    try {
      await client.connect()
      fail('explected promise to faile')
    } catch (error: any) {
      expect(error).toBe('To many requests')
    }
  })

  it('creates a cookieless connection and generates tokens', async () => {
    const sessionTokens = {
      api_token: 'abcdef-api',
      api_token_ttl: 30000,
      navigation_token: 'abcdef-nav',
      navigation_token_ttl: 30000,
      session_reference_token_ttl: 30000,
    }
    const authResponse = {
      authentication_token: 'abcdef-auth',
      ...sessionTokens,
    }
    const fetchSpy = spyOn(window, 'fetch').and.returnValue({
      json: () => authResponse,
      ok: true,
      status: 200,
    })
    const client = getClient({
      acquireSession: '/acquire-session',
      generateTokens: '/generate-tokens',
    })
    const connection = await client.connect()
    const connectionSendSpy = spyOn(connection, 'send')
    expect(fetchSpy).toHaveBeenCalledWith('/acquire-session', undefined)
    expect(mockHostBuilder._url).toBe(
      'https://myhost.com/login/embed/%2Fembed%2Fpreload%2F%3Fembed_domain%3Dhttp%253A%252F%252Flocalhost%253A9876%26sdk%3D2%26embed_navigation_token%3Dabcdef-nav?embed_authentication_token=abcdef-auth'
    )
    expect(mockHostBuilder.countHandlersOfType('session:tokens:request')).toBe(
      1
    )
    expect(mockHostBuilder.countHandlersOfType('page:changed')).toBe(1)
    expect(mockHostBuilder.countHandlersOfType('env:client:dialog')).toBe(1)
    expect(mockHostBuilder.countHandlersOfType('page:properties:changed')).toBe(
      1
    )
    expect(mockHostBuilder._sandboxAttributes).toEqual(['allow-popups'])
    expect(mockHostBuilder._allowAttributes).toEqual(['allowfullscreen'])
    expect(mockChattyHost.iframe.className).toBe('myiframe-container')
    expect(client.isConnected).toBeTruthy()
    expect(client.connection).toBeDefined()
    mockHostBuilder.fireEventForHandler('session:tokens:request', authResponse)
    expect(connectionSendSpy).toHaveBeenCalledWith(
      'session:tokens',
      sessionTokens
    )

    // generate more tokens
    fetchSpy.calls.reset()
    connectionSendSpy.calls.reset()
    mockHostBuilder.fireEventForHandler('session:tokens:request', sessionTokens)
    expect(fetchSpy).toHaveBeenCalledWith('/generate-tokens', {
      body: JSON.stringify({
        api_token: sessionTokens.api_token,
        navigation_token: sessionTokens.navigation_token,
      }),
      headers: { 'content-type': 'application/json' },
      method: 'PUT',
    })
    await waitFor(() => connectionSendSpy.calls.count() > 0)
    expect(connectionSendSpy).toHaveBeenCalledWith(
      'session:tokens',
      sessionTokens
    )
  })

  it('creates a cookieless connection using a CookielessRequestInit type', async () => {
    const sessionTokens = {
      api_token: 'abcdef-api',
      api_token_ttl: 30000,
      navigation_token: 'abcdef-nav',
      navigation_token_ttl: 30000,
      session_reference_token_ttl: 30000,
    }
    const authResponse = {
      authentication_token: 'abcdef-auth',
      ...sessionTokens,
    }
    const fetchSpy = spyOn(window, 'fetch').and.returnValue({
      json: () => authResponse,
      ok: true,
      status: 200,
    })
    const client = getClient({
      acquireSession: { method: 'POST', url: '/acquire-session' },
      generateTokens: { method: 'POST', url: '/generate-tokens' },
    })
    await client.connect()
    expect(fetchSpy).toHaveBeenCalledWith('/acquire-session', {
      method: 'POST',
    })
    mockHostBuilder.fireEventForHandler('session:tokens:request', authResponse)

    // generate more tokens
    fetchSpy.calls.reset()
    mockHostBuilder.fireEventForHandler('session:tokens:request', sessionTokens)
    expect(fetchSpy).toHaveBeenCalledWith('/generate-tokens', {
      body: JSON.stringify({
        api_token: sessionTokens.api_token,
        navigation_token: sessionTokens.navigation_token,
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    })
  })

  it('handles an acquire cookieless connection failure', async () => {
    spyOn(window, 'fetch').and.returnValue({
      ok: false,
      status: 429,
    })
    spyOn(console, 'error')
    const client = getClient({
      acquireSession: '/acquire-session',
      generateTokens: '/generate-tokens',
    })
    try {
      await client.connect()
      fail('Expected connect to fail')
    } catch (error: any) {
      expect(error.message).toBe('acquire embed session failed')
    }
  })

  it('handles a badly formatted acquire session response', async () => {
    const authResponse = {}
    spyOn(window, 'fetch').and.returnValue({
      json: () => authResponse,
      ok: true,
      status: 200,
    })
    const client = getClient({
      acquireSession: '/acquire-session',
      generateTokens: '/generate-tokens',
    })
    try {
      await client.connect()
      fail('Expected connect to fail')
    } catch (error: any) {
      expect(error.message).toBe('failed to prepare cookieless embed session')
    }
  })

  it('handles a generate tokens failure', async () => {
    const sessionTokens = {
      api_token: 'abcdef-api',
      api_token_ttl: 30000,
      navigation_token: 'abcdef-nav',
      navigation_token_ttl: 30000,
      session_reference_token_ttl: 30000,
    }
    const authResponse = {
      authentication_token: 'abcdef-auth',
      ...sessionTokens,
    }
    const fetchSpy = spyOn(window, 'fetch').and.returnValues(
      {
        json: () => authResponse,
        ok: true,
        status: 200,
      },
      {
        ok: false,
        status: 429,
      }
    )
    const client = getClient({
      acquireSession: '/acquire-session',
      generateTokens: '/generate-tokens',
    })
    const connection = await client.connect()
    const connectionSendSpy = spyOn(connection, 'send')
    mockHostBuilder.fireEventForHandler('session:tokens:request', authResponse)

    // generate more tokens
    mockHostBuilder.fireEventForHandler('session:tokens:request', sessionTokens)
    expect(fetchSpy).toHaveBeenCalledWith('/generate-tokens', {
      body: JSON.stringify({
        api_token: sessionTokens.api_token,
        navigation_token: sessionTokens.navigation_token,
      }),
      headers: { 'content-type': 'application/json' },
      method: 'PUT',
    })
    await waitFor(() => connectionSendSpy.calls.count() > 1)
    expect(connectionSendSpy.calls.mostRecent().args).toEqual([
      'session:tokens',
      {
        api_token: undefined,
        api_token_ttl: undefined,
        navigation_token: undefined,
        navigation_token_ttl: undefined,
        session_reference_token_ttl: 0,
      },
    ])
  })

  it('creates a cookieless connection and generates tokens using callbacks', async () => {
    const sessionTokens = {
      api_token: 'abcdef-api',
      api_token_ttl: 10000,
      navigation_token: 'abcdef-nav',
      navigation_token_ttl: 10000,
      session_reference_token_ttl: 30000,
    }
    const generatedTokens = {
      api_token: 'uvwxyz-api',
      api_token_ttl: 10000,
      navigation_token: 'uvwxyz-nav',
      navigation_token_ttl: 31000,
      session_reference_token_ttl: 25000,
    }
    const authResponse = {
      authentication_token: 'abcdef-auth',
      ...sessionTokens,
    }
    const acquireSessionCallback = () => Promise.resolve(authResponse)
    const generateTokensCallback = (
      tokens: LookerEmbedCookielessTokenData
    ): Promise<LookerEmbedCookielessSessionData> => {
      expect(tokens).toEqual(sessionTokens)
      return Promise.resolve(generatedTokens)
    }
    const callbackFunctions = { acquireSessionCallback, generateTokensCallback }
    const acquireSessionCallbackSpy = spyOn(
      callbackFunctions,
      'acquireSessionCallback'
    ).and.callThrough()
    const generateTokensCallbackSpy = spyOn(
      callbackFunctions,
      'generateTokensCallback'
    ).and.callThrough()
    const client = getClient({
      acquireSession: callbackFunctions.acquireSessionCallback,
      generateTokens: callbackFunctions.generateTokensCallback,
    })
    const connection = await client.connect()
    const connectionSendSpy = spyOn(connection, 'send')
    expect(mockHostBuilder._url).toBe(
      'https://myhost.com/login/embed/%2Fembed%2Fpreload%2F%3Fembed_domain%3Dhttp%253A%252F%252Flocalhost%253A9876%26sdk%3D2%26embed_navigation_token%3Dabcdef-nav?embed_authentication_token=abcdef-auth'
    )
    expect(mockHostBuilder.countHandlersOfType('session:tokens:request')).toBe(
      1
    )
    expect(mockHostBuilder.countHandlersOfType('page:changed')).toBe(1)
    expect(mockHostBuilder.countHandlersOfType('env:client:dialog')).toBe(1)
    expect(mockHostBuilder.countHandlersOfType('page:properties:changed')).toBe(
      1
    )
    expect(mockHostBuilder._sandboxAttributes).toEqual(['allow-popups'])
    expect(mockHostBuilder._allowAttributes).toEqual(['allowfullscreen'])
    expect(mockChattyHost.iframe.className).toBe('myiframe-container')
    expect(client.isConnected).toBeTruthy()
    expect(client.connection).toBeDefined()
    mockHostBuilder.fireEventForHandler('session:tokens:request', authResponse)
    expect(connectionSendSpy).toHaveBeenCalledWith(
      'session:tokens',
      sessionTokens
    )
    expect(acquireSessionCallbackSpy).toHaveBeenCalled()

    // generate more tokens
    connectionSendSpy.calls.reset()
    mockHostBuilder.fireEventForHandler('session:tokens:request', sessionTokens)
    await waitFor(() => connectionSendSpy.calls.count() > 0)
    expect(connectionSendSpy).toHaveBeenCalledWith(
      'session:tokens',
      generatedTokens
    )
    expect(generateTokensCallbackSpy).toHaveBeenCalled()
  })

  it('handles open dialog events', async () => {
    const scrollIntoViewSpy = jasmine.createSpy('scrollIntoViewSpy')
    mockChattyHost.iframe.scrollIntoView = scrollIntoViewSpy
    const client = getClient()
    await client.connect()
    expect(client.isConnected).toBeTruthy()
    mockHostBuilder.fireEventForHandler('env:client:dialog', {
      open: true,
      placement: 'cover',
    })
    await waitFor(() => scrollIntoViewSpy.calls.count() > 0, { timeout: 200 })
    expect(scrollIntoViewSpy).toHaveBeenCalled()
  })

  it('dynamically updates the IFRAME height', async () => {
    const scrollIntoViewSpy = jasmine.createSpy('scrollIntoViewSpy')
    mockChattyHost.iframe.scrollIntoView = scrollIntoViewSpy
    const client = getClient()
    await client.connect()
    expect(client.isConnected).toBeTruthy()
    mockHostBuilder.fireEventForHandler('page:properties:changed', {
      height: 1042,
    })
    expect(mockChattyHost.iframe.style.height).toBe('1042px')
  })

  it('sends scroll messages', async () => {
    const scrollIntoViewSpy = jasmine.createSpy('scrollIntoViewSpy')
    mockChattyHost.iframe.scrollIntoView = scrollIntoViewSpy
    const client = getClient()
    const connection = await client.connect()
    expect(client.isConnected).toBeTruthy()
    const connectionSendSpy = spyOn(connection, 'send')
    document.dispatchEvent(new Event('scroll'))
    expect(connectionSendSpy).toHaveBeenCalledWith('env:host:scroll', {
      offsetLeft: mockChattyHost.iframe.offsetLeft,
      offsetTop: mockChattyHost.iframe.offsetTop,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    })
    connectionSendSpy.calls.reset()
    window.dispatchEvent(new Event('resize'))
    expect(connectionSendSpy).toHaveBeenCalledWith('env:host:scroll', {
      offsetLeft: mockChattyHost.iframe.offsetLeft,
      offsetTop: mockChattyHost.iframe.offsetTop,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    })
  })
})
