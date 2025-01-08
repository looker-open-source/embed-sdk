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
} from '../../src/types'
import { LookerEmbedExSDK } from '../../src/v2/LookerEmbedExSDK'
import type { EmbedConnection } from '../../src/v2/EmbedConnection'
import {
  MockChattyHost,
  MockChattyHostConnection,
  MockHostBuilder,
  waitFor,
} from './test_utils'

describe('DashboardConnection', () => {
  let mockChattyHostConnection: MockChattyHostConnection
  let mockChattyHost: MockChattyHost
  let mockHostBuilder: MockHostBuilder

  const getDashboardConnection = async (
    options: {
      apiHost?: string
      auth?: string | LookerAuthConfig
      acquireSession?: string | CookielessRequestInit | CookielessCallback
      generateTokens?: string | CookielessRequestInit | GenerateTokensCallback
    } = {}
  ) => {
    const {
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
    const connection = (await sdk
      .preload()
      .build()
      .connect()) as EmbedConnection
    return connection.asDashboardConnection()
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

  it('runs a dashboard', async () => {
    const chattySendSpy = spyOn(
      mockChattyHostConnection,
      'send'
    ).and.callThrough()
    const connection = await getDashboardConnection()
    connection.run()
    await waitFor(() => chattySendSpy.calls.count() > 0)
    expect(chattySendSpy).toHaveBeenCalledWith('dashboard:run', undefined)
  })

  it('stops a dashboard', async () => {
    const chattySendSpy = spyOn(
      mockChattyHostConnection,
      'send'
    ).and.callThrough()
    const connection = await getDashboardConnection()
    connection.stop()
    await waitFor(() => chattySendSpy.calls.count() > 0)
    expect(chattySendSpy).toHaveBeenCalledWith('dashboard:stop', undefined)
  })

  it('edits a dashboard', async () => {
    const chattySendSpy = spyOn(
      mockChattyHostConnection,
      'send'
    ).and.callThrough()
    const connection = await getDashboardConnection()
    connection.edit()
    await waitFor(() => chattySendSpy.calls.count() > 0)
    expect(chattySendSpy).toHaveBeenCalledWith('dashboard:edit', undefined)
  })

  it('updates dashboard filters', async () => {
    const chattySendSpy = spyOn(
      mockChattyHostConnection,
      'send'
    ).and.callThrough()
    const connection = await getDashboardConnection()
    connection.updateFilters({ state: 'Califonia' })
    await waitFor(() => chattySendSpy.calls.count() > 0)
    expect(chattySendSpy).toHaveBeenCalledWith('dashboard:filters:update', {
      filters: {
        state: 'Califonia',
      },
    })
  })

  it('sets dashboard options', async () => {
    const chattySendSpy = spyOn(
      mockChattyHostConnection,
      'send'
    ).and.callThrough()
    const connection = await getDashboardConnection()
    connection.setOptions({ elements: {}, layouts: [] })
    await waitFor(() => chattySendSpy.calls.count() > 0)
    expect(chattySendSpy).toHaveBeenCalledWith('dashboard:options:set', {
      elements: {},
      layouts: [],
    })
  })

  it('opens the schedule dialog', async () => {
    const chattySendAndReceiveSpy = spyOn(
      mockChattyHostConnection,
      'sendAndReceive'
    ).and.callThrough()
    const connection = await getDashboardConnection()
    await connection.openScheduleDialog()
    expect(chattySendAndReceiveSpy).toHaveBeenCalledWith(
      'dashboard:schedule_modal:open',
      undefined
    )
  })
})
