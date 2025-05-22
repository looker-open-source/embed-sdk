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
import type { ChattyHostBuilder } from '@looker/chatty'
import type {
  CookielessCallback,
  CookielessRequestInit,
  GenerateTokensCallback,
  LookerAuthConfig,
  LookerEmbedCookielessSessionData,
  LookerEmbedCookielessTokenData,
} from '../src/types'
import type { EmbedClientEx } from '../src/EmbedClientEx'
import type { EmbedBuilderEx } from '../src/EmbedBuilderEx'
import { LookerEmbedExSDK } from '../src/LookerEmbedExSDK'
import {
  waitFor,
  MockChattyHost,
  MockChattyHostConnection,
  MockHostBuilder,
} from './test_utils'

const BASE_DATE = 1561486800168

describe('EmbedClientEx', () => {
  let mockChattyHostConnection: MockChattyHostConnection
  let mockChattyHost: MockChattyHost
  let mockHostBuilder: MockHostBuilder
  let saveSetInterval: any

  const getClient = (
    options: {
      sandboxedHost?: boolean
      apiHost?: string
      auth?: string | LookerAuthConfig
      acquireSession?: string | CookielessRequestInit | CookielessCallback
      generateTokens?: string | CookielessRequestInit | GenerateTokensCallback
      createUrl?: string
      allowLoginScreen?: boolean
      ariaLabel?: string
    } = {}
  ) => {
    const {
      sandboxedHost = false,
      apiHost = 'myhost.com',
      auth,
      acquireSession,
      generateTokens,
      createUrl,
      allowLoginScreen,
      ariaLabel,
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
    let builder: EmbedBuilderEx
    if (createUrl) {
      builder = sdk.createWithUrl(createUrl) as EmbedBuilderEx
    } else {
      builder = sdk.preload() as EmbedBuilderEx
    }
    if (allowLoginScreen) {
      builder.withAllowLoginScreen()
    }
    if (ariaLabel) {
      builder.withAriaLabel(ariaLabel)
    }
    builder
      .withDialogScroll()
      .withDynamicIFrameHeight()
      .withSandboxAttr('allow-popups')
      .withAllowAttr('allowfullscreen')
      .withClassName('myiframe-container')
      .withScrollMonitor()
    builder.sandboxedHost = sandboxedHost
    return builder.build() as EmbedClientEx
  }

  beforeAll(() => {
    saveSetInterval = setInterval
  })

  beforeEach(() => {
    mock.setup()
    mockChattyHostConnection = new MockChattyHostConnection()
    mockChattyHost = new MockChattyHost()
    mockChattyHost._hostConnection = mockChattyHostConnection
    mockHostBuilder = new MockHostBuilder()
    mockHostBuilder._chattyHost = mockChattyHost
    jest.useFakeTimers()
    jest.setSystemTime(new Date(BASE_DATE))
  })

  afterEach(() => {
    jest.useRealTimers()
    mock.teardown()
  })

  it('creates a private connection', async () => {
    const client = getClient()
    await client.connect()
    expect(mockHostBuilder._url).toBe(
      'https://myhost.com/embed/preload/?embed_domain=http://localhost&sdk=3'
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

  it('creates a private connection with the allow login screen', async () => {
    const client = getClient({ allowLoginScreen: true })
    await client.connect()
    expect(mockHostBuilder._url).toBe(
      'https://myhost.com/embed/preload/?embed_domain=http://localhost&sdk=3&allow_login_screen=true'
    )
  })

  it('creates a sandbox hosted private connection', async () => {
    const client = getClient({ sandboxedHost: true })
    await client.connect()
    expect(mockHostBuilder._url).toBe(
      'https://myhost.com/embed/preload/?embed_domain=https://myhost.com&sandboxed_host=true&sdk=3'
    )
  })

  it('ignores with allow_login_screen for a sandbox hosted private connection', async () => {
    const client = getClient({ allowLoginScreen: true, sandboxedHost: true })
    await client.connect()
    expect(mockHostBuilder._url).toBe(
      'https://myhost.com/embed/preload/?embed_domain=https://myhost.com&sandboxed_host=true&sdk=3'
    )
  })

  it('creates a sandbox hosted private connection simulating legacy extension framework', async () => {
    const client = getClient({
      apiHost: 'https://mylooker.com',
      sandboxedHost: true,
    })
    await client.connect()
    expect(mockHostBuilder._url).toBe(
      'https://mylooker.com/embed/preload/?embed_domain=https://mylooker.com&sandboxed_host=true&sdk=3'
    )
  })

  it('creates a private connection simulating enhanced extension framework', async () => {
    const client = getClient({
      apiHost: 'https://mylooker.com',
    })
    await client.connect()
    expect(mockHostBuilder._url).toBe(
      'https://mylooker.com/embed/preload/?embed_domain=http://localhost&sdk=3'
    )
  })

  it('creates a private connection and waits for a connection', async () => {
    const client = getClient({
      apiHost: 'https://mylooker.com',
    })
    const connectPromise = client.connect({ waitUntilLoaded: true })
    expect(mockHostBuilder._url).toBe(
      'https://mylooker.com/embed/preload/?embed_domain=http://localhost&sdk=3'
    )
    mockHostBuilder.fireEventForHandler('page:changed', {})
    await connectPromise
  })

  it('adds embed domain and sdk to URL', async () => {
    const client = getClient({
      apiHost: 'https://mylooker.com',
      createUrl: '/embed/dashboards/42?my_filter=123',
    })
    await client.connect()
    expect(mockHostBuilder._url).toBe(
      'https://mylooker.com/embed/dashboards/42?my_filter=123&embed_domain=http://localhost&sdk=3'
    )
  })

  it('does not add embed domain and sdk to URL when they are present', async () => {
    const client = getClient({
      apiHost: 'https://mylooker.com',
      createUrl:
        '/embed/dashboards/42?embed_domain=http://localhost&sdk=3&my_filter=123',
    })
    await client.connect()
    expect(mockHostBuilder._url).toBe(
      'https://mylooker.com/embed/dashboards/42?embed_domain=http://localhost&sdk=3&my_filter=123'
    )
  })

  it('adds /embed to url when missing', async () => {
    const client = getClient({
      apiHost: 'https://mylooker.com',
      createUrl:
        '/dashboards/42?embed_domain=http://localhost&sdk=3&my_filter=123',
    })
    await client.connect()
    expect(mockHostBuilder._url).toBe(
      'https://mylooker.com/embed/dashboards/42?embed_domain=http://localhost&sdk=3&my_filter=123'
    )
  })

  it('strips host from URL', async () => {
    const client = getClient({
      apiHost: 'https://mylooker.com',
      createUrl: 'https://mylooker.com/embed/dashboards/42?my_filter=123',
    })
    await client.connect()
    expect(mockHostBuilder._url).toBe(
      'https://mylooker.com/embed/dashboards/42?my_filter=123&embed_domain=http://localhost&sdk=3'
    )
  })

  it('strips host from URL and adds missing /embed', async () => {
    const client = getClient({
      apiHost: 'https://mylooker.com',
      createUrl: 'https://mylooker.com/dashboards/42?my_filter=123',
    })
    await client.connect()
    expect(mockHostBuilder._url).toBe(
      'https://mylooker.com/embed/dashboards/42?my_filter=123&embed_domain=http://localhost&sdk=3'
    )
  })

  it('throws an error if the embed URL is invalod', async () => {
    expect(() => {
      getClient({
        apiHost: 'https://mylooker.com',
        createUrl:
          'https://mylooker.com::9999/embed/dashboards/42?my_filter=123',
      })
    }).toThrow(
      'Invalid embed URL https://mylooker.com::9999/embed/dashboards/42?my_filter=123'
    )
  })

  it('creates a signed url connection', async () => {
    const authResponse = {
      url: `https://mylooker.com/login/embed${encodeURIComponent(
        '/embed/preload/?embed_domain=http://localhost&sdk=3'
      )}?external_user_id=postmanpat&signature=1234567890abcdef`,
    }
    mock.get(/\/auth\?src=/, (req, res) => {
      expect(req.url().toString()).toBe(
        '/auth?src=%2Fembed%2Fpreload%2F%3Fembed_domain%3Dhttp%3A%2F%2Flocalhost%26sdk%3D3&param_1=value_1&param_2=value_2'
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
      api_token_ttl: 600,
      navigation_token: 'abcdef-nav',
      navigation_token_ttl: 600,
      session_reference_token_ttl: 30000,
    }
    const authResponse = {
      authentication_token: 'abcdef-auth',
      ...sessionTokens,
    }
    const fetchSpy = jest.spyOn(window, 'fetch').mockReturnValue(
      Promise.resolve({
        json: () => {
          return Promise.resolve(authResponse)
        },
        ok: true,
        status: 200,
      }) as any
    )
    const client = getClient({
      acquireSession: '/acquire-session',
      generateTokens: '/generate-tokens',
    })
    await client.connect()
    const chattySendSpy = jest.spyOn(mockChattyHostConnection, 'send')
    expect(fetchSpy).toHaveBeenCalledWith('/acquire-session', undefined)
    expect(mockHostBuilder._url).toBe(
      'https://myhost.com/login/embed/%2Fembed%2Fpreload%2F%3Fembed_domain%3Dhttp%3A%2F%2Flocalhost%26sdk%3D3%26embed_navigation_token%3Dabcdef-nav?embed_authentication_token=abcdef-auth'
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
    expect(chattySendSpy).toHaveBeenCalledWith('session:tokens', sessionTokens)

    // generate more tokens

    jest.setSystemTime(new Date(BASE_DATE + 500 * 1000))
    jest.advanceTimersByTime(500 * 1000)
    fetchSpy.mockClear()
    chattySendSpy.mockClear()
    mockHostBuilder.fireEventForHandler('session:tokens:request', sessionTokens)
    expect(fetchSpy).toHaveBeenCalledWith('/generate-tokens', {
      body: JSON.stringify({
        api_token: sessionTokens.api_token,
        navigation_token: sessionTokens.navigation_token,
      }),
      headers: { 'content-type': 'application/json' },
      method: 'PUT',
    })
    await waitFor(() => chattySendSpy.mock.calls.length > 0, {
      setInterval: saveSetInterval,
    })
    expect(chattySendSpy).toHaveBeenCalledWith('session:tokens', sessionTokens)
  })

  it('creates a cookieless connection using a CookielessRequestInit type', async () => {
    const sessionTokens = {
      api_token: 'abcdef-api',
      api_token_ttl: 600,
      navigation_token: 'abcdef-nav',
      navigation_token_ttl: 600,
      session_reference_token_ttl: 30000,
    }
    const authResponse = {
      authentication_token: 'abcdef-auth',
      ...sessionTokens,
    }
    const fetchSpy = jest.spyOn(window, 'fetch').mockReturnValue({
      json: () => authResponse,
      ok: true,
      status: 200,
    } as any)
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

    jest.setSystemTime(new Date(BASE_DATE + 500 * 1000))
    jest.advanceTimersByTime(500 * 1000)
    fetchSpy.mockClear()
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
    jest.spyOn(window, 'fetch').mockReturnValue({
      ok: false,
      status: 429,
    } as any)
    jest.spyOn(console, 'error').mockImplementation(() => {
      // noop
    })
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
    jest.spyOn(window, 'fetch').mockReturnValue({
      json: () => authResponse,
      ok: true,
      status: 200,
    } as any)
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
      api_token_ttl: 600,
      navigation_token: 'abcdef-nav',
      navigation_token_ttl: 600,
      session_reference_token_ttl: 30000,
    }
    const authResponse = {
      authentication_token: 'abcdef-auth',
      ...sessionTokens,
    }
    const fetchSpy = jest
      .spyOn(window, 'fetch')
      .mockReturnValueOnce({
        json: () => authResponse,
        ok: true,
        status: 200,
      } as any)
      .mockReturnValueOnce({
        ok: false,
        status: 429,
      } as any)
    const client = getClient({
      acquireSession: '/acquire-session',
      generateTokens: '/generate-tokens',
    })
    await client.connect()
    const chattySendSpy = jest.spyOn(mockChattyHostConnection, 'send')
    mockHostBuilder.fireEventForHandler('session:tokens:request', authResponse)
    chattySendSpy.mockClear()

    // generate more tokens

    jest.setSystemTime(new Date(BASE_DATE + 500 * 1000))
    jest.advanceTimersByTime(500 * 1000)
    mockHostBuilder.fireEventForHandler('session:tokens:request', sessionTokens)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(fetchSpy).toHaveBeenLastCalledWith('/generate-tokens', {
      body: JSON.stringify({
        api_token: sessionTokens.api_token,
        navigation_token: sessionTokens.navigation_token,
      }),
      headers: { 'content-type': 'application/json' },
      method: 'PUT',
    })
    await waitFor(() => chattySendSpy.mock.calls.length > 0, {
      setInterval: saveSetInterval,
    })
    expect(chattySendSpy).toHaveBeenCalledWith('session:tokens', {
      api_token: undefined,
      api_token_ttl: undefined,
      navigation_token: undefined,
      navigation_token_ttl: undefined,
      session_reference_token_ttl: undefined,
    })
  })

  it('creates a cookieless connection and generates tokens using callbacks', async () => {
    const sessionTokens = {
      api_token: 'abcdef-api',
      api_token_ttl: 600,
      navigation_token: 'abcdef-nav',
      navigation_token_ttl: 600,
      session_reference_token_ttl: 30000,
    }
    const generatedTokens = {
      api_token: 'uvwxyz-api',
      api_token_ttl: 600,
      navigation_token: 'uvwxyz-nav',
      navigation_token_ttl: 600,
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
    const acquireSessionCallbackSpy = jest.spyOn(
      callbackFunctions,
      'acquireSessionCallback'
    )
    const generateTokensCallbackSpy = jest.spyOn(
      callbackFunctions,
      'generateTokensCallback'
    )
    const client = getClient({
      acquireSession: callbackFunctions.acquireSessionCallback,
      generateTokens: callbackFunctions.generateTokensCallback,
    })
    await client.connect()
    const chattySendSpy = jest.spyOn(mockChattyHostConnection, 'send')
    expect(mockHostBuilder._url).toBe(
      'https://myhost.com/login/embed/%2Fembed%2Fpreload%2F%3Fembed_domain%3Dhttp%3A%2F%2Flocalhost%26sdk%3D3%26embed_navigation_token%3Dabcdef-nav?embed_authentication_token=abcdef-auth'
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
    expect(chattySendSpy).toHaveBeenCalledWith('session:tokens', sessionTokens)
    expect(acquireSessionCallbackSpy).toHaveBeenCalled()

    // generate more tokens

    jest.setSystemTime(new Date(BASE_DATE + 500 * 1000))
    jest.advanceTimersByTime(500 * 1000)
    chattySendSpy.mockClear()
    mockHostBuilder.fireEventForHandler('session:tokens:request', sessionTokens)
    await waitFor(() => chattySendSpy.mock.calls.length > 0, {
      setInterval: saveSetInterval,
    })
    expect(chattySendSpy).toHaveBeenCalledWith(
      'session:tokens',
      generatedTokens
    )
    expect(generateTokensCallbackSpy).toHaveBeenCalled()
  })

  it('handles open dialog events', async () => {
    const scrollIntoViewSpy = jest.fn()
    mockChattyHost.iframe.scrollIntoView = scrollIntoViewSpy
    const client = getClient()
    await client.connect()
    expect(client.isConnected).toBeTruthy()
    mockHostBuilder.fireEventForHandler('env:client:dialog', {
      open: true,
      placement: 'cover',
    })
    await waitFor(() => scrollIntoViewSpy.mock.calls.length > 0, {
      setInterval: saveSetInterval,
      timeout: 200,
    })
    expect(scrollIntoViewSpy).toHaveBeenCalled()
  })

  it('dynamically updates the IFRAME height', async () => {
    const scrollIntoViewSpy = jest.fn()
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
    const scrollIntoViewSpy = jest.fn()
    mockChattyHost.iframe.scrollIntoView = scrollIntoViewSpy
    const client = getClient()
    await client.connect()
    expect(client.isConnected).toBeTruthy()
    const chattySendSpy = jest.spyOn(mockChattyHostConnection, 'send')
    document.dispatchEvent(new Event('scroll'))
    expect(chattySendSpy).toHaveBeenCalledWith('env:host:scroll', {
      offsetLeft: mockChattyHost.iframe.offsetLeft,
      offsetTop: mockChattyHost.iframe.offsetTop,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    })
    chattySendSpy.mockReset()
    window.dispatchEvent(new Event('resize'))
    expect(chattySendSpy).toHaveBeenCalledWith('env:host:scroll', {
      offsetLeft: mockChattyHost.iframe.offsetLeft,
      offsetTop: mockChattyHost.iframe.offsetTop,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    })
  })

  it('clears the session when the session expires', async () => {
    const client = getClient()
    const connection = await client.connect()
    expect(connection.hasSessionExpired()).toBeFalsy()
    mockHostBuilder.fireEventForHandler('session:expired')
    expect(connection.hasSessionExpired()).toBeTruthy()
  })
})
