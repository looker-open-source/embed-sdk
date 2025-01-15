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
} from '../src/types'
import { LookerEmbedExSDK } from '../src/LookerEmbedExSDK'
import type { EmbedConnection } from '../src/EmbedConnection'
import {
  MockChattyHost,
  MockChattyHostConnection,
  MockHostBuilder,
} from './test_utils'

describe('EmbedConnection', () => {
  let mockChattyHostConnection: MockChattyHostConnection
  let mockChattyHost: MockChattyHost
  let mockHostBuilder: MockHostBuilder

  const getConnection = (
    options: {
      apiHost?: string
      auth?: string | LookerAuthConfig
      acquireSession?: string | CookielessRequestInit | CookielessCallback
      generateTokens?: string | CookielessRequestInit | GenerateTokensCallback
      dashboardId?: string
    } = {}
  ) => {
    const {
      apiHost = 'myhost.com',
      auth,
      acquireSession,
      generateTokens,
      dashboardId,
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
    if (dashboardId) {
      return sdk
        .createDashboardWithId(dashboardId)
        .build()
        .connect() as Promise<EmbedConnection>
    }
    return sdk
      .preload()
      .build()
      .connect()
      .then((connection) => {
        mockHostBuilder.fireEventForHandler('page:changed', {
          page: {
            lookerVersion: '25.1.0',
            url: '/embed/preload?embed_domain=http://localhost:9876&sdk=3',
          },
        })
        return connection
      }) as Promise<EmbedConnection>
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

  it('loads a dashboard', async () => {
    const connection = await getConnection()
    const chattySendAndReceiveSpy = spyOn(
      mockChattyHostConnection,
      'sendAndReceive'
    ).and.callThrough()
    await connection.loadDashboard('42', false, false)
    mockHostBuilder.fireEventForHandler('page:changed', {
      page: {
        lookerVersion: '25.1.0',
        url: '/embed/dashboards/42?embed_domain=http://localhost:9876&sdk=3',
      },
    })
    expect(chattySendAndReceiveSpy).toHaveBeenCalledWith('page:load', {
      pushHistory: false,
      url: '/embed/dashboards/42?embed_domain=http://localhost:9876&sdk=3',
    })
  })

  it('waits for a dashboard to be loaded', async () => {
    const connection = await getConnection()
    const chattySendAndReceiveSpy = spyOn(
      mockChattyHostConnection,
      'sendAndReceive'
    ).and.callThrough()
    const loadPromise = connection.loadDashboard('42')
    mockHostBuilder.fireEventForHandler('page:changed', {
      page: {
        lookerVersion: '25.1.0',
        url: '/embed/dashboards/42?embed_domain=http://localhost:9876&sdk=3',
      },
    })
    await loadPromise
    expect(chattySendAndReceiveSpy).toHaveBeenCalledWith('page:load', {
      pushHistory: false,
      url: '/embed/dashboards/42?embed_domain=http://localhost:9876&sdk=3',
    })
  })

  it('loads an explore', async () => {
    const connection = await getConnection()
    const chattySendAndReceiveSpy = spyOn(
      mockChattyHostConnection,
      'sendAndReceive'
    ).and.callThrough()
    await connection.loadExplore('mymodel::myview', false, false)
    expect(chattySendAndReceiveSpy).toHaveBeenCalledWith('page:load', {
      pushHistory: false,
      url: '/embed/explore/mymodel/myview?embed_domain=http://localhost:9876&sdk=3',
    })
  })

  it('waits for an explore to be loaded', async () => {
    const connection = await getConnection()
    const chattySendAndReceiveSpy = spyOn(
      mockChattyHostConnection,
      'sendAndReceive'
    ).and.callThrough()
    const loadPromise = connection.loadExplore('mymodel/myview')
    mockHostBuilder.fireEventForHandler('page:changed', {})
    await loadPromise
    expect(chattySendAndReceiveSpy).toHaveBeenCalledWith('page:load', {
      pushHistory: false,
      url: '/embed/explore/mymodel/myview?embed_domain=http://localhost:9876&sdk=3',
    })
  })

  it('loads a look', async () => {
    const connection = await getConnection()
    const chattySendAndReceiveSpy = spyOn(
      mockChattyHostConnection,
      'sendAndReceive'
    ).and.callThrough()
    await connection.loadLook('42', false, false)
    expect(chattySendAndReceiveSpy).toHaveBeenCalledWith('page:load', {
      pushHistory: false,
      url: '/embed/looks/42?embed_domain=http://localhost:9876&sdk=3',
    })
  })

  it('waits for a look to be loaded', async () => {
    const connection = await getConnection()
    const chattySendAndReceiveSpy = spyOn(
      mockChattyHostConnection,
      'sendAndReceive'
    ).and.callThrough()
    const loadPromise = connection.loadLook('42')
    mockHostBuilder.fireEventForHandler('page:changed', {})
    await loadPromise
    expect(chattySendAndReceiveSpy).toHaveBeenCalledWith('page:load', {
      pushHistory: false,
      url: '/embed/looks/42?embed_domain=http://localhost:9876&sdk=3',
    })
  })

  it('loads an extension', async () => {
    const connection = await getConnection()
    const chattySendAndReceiveSpy = spyOn(
      mockChattyHostConnection,
      'sendAndReceive'
    ).and.callThrough()
    await connection.loadExtension('myproj::myext', false, false)
    expect(chattySendAndReceiveSpy).toHaveBeenCalledWith('page:load', {
      pushHistory: false,
      url: '/embed/extensions/myproj::myext?embed_domain=http://localhost:9876&sdk=3',
    })
  })

  it('waits for an extension to be loaded', async () => {
    const connection = await getConnection()
    const chattySendAndReceiveSpy = spyOn(
      mockChattyHostConnection,
      'sendAndReceive'
    ).and.callThrough()
    const loadPromise = connection.loadExtension('myproj::myext')
    mockHostBuilder.fireEventForHandler('page:changed', {})
    await loadPromise
    expect(chattySendAndReceiveSpy).toHaveBeenCalledWith('page:load', {
      pushHistory: false,
      url: '/embed/extensions/myproj::myext?embed_domain=http://localhost:9876&sdk=3',
    })
  })

  it('loads preload', async () => {
    const connection = await getConnection()
    const chattySendAndReceiveSpy = spyOn(
      mockChattyHostConnection,
      'sendAndReceive'
    ).and.callThrough()
    await connection.preload(false, false)
    expect(chattySendAndReceiveSpy).toHaveBeenCalledWith('page:load', {
      pushHistory: false,
      url: '/embed/preload?embed_domain=http://localhost:9876&sdk=3',
    })
  })

  it('waits for preload to be loaded', async () => {
    const connection = await getConnection()
    const chattySendAndReceiveSpy = spyOn(
      mockChattyHostConnection,
      'sendAndReceive'
    ).and.callThrough()
    const loadPromise = connection.preload()
    mockHostBuilder.fireEventForHandler('page:changed', {})
    await loadPromise
    expect(chattySendAndReceiveSpy).toHaveBeenCalledWith('page:load', {
      pushHistory: false,
      url: '/embed/preload?embed_domain=http://localhost:9876&sdk=3',
    })
  })

  it('identfies the pageType correctly', async () => {
    const connection = await getConnection()
    const loadPromise = connection.loadExplore('mymodel/myview')
    mockHostBuilder.fireEventForHandler('page:changed', {
      page: {
        url: '/embed/explore/mymodel/myview?embed_domain=http://localhost:9876&sdk=3',
      },
    })
    await loadPromise
    expect(connection.getPageType()).toBe('explore')
    mockHostBuilder.fireEventForHandler('page:changed', {
      page: {
        url: '/embed/dashboards/42?embed_domain=http://localhost:9876&sdk=3',
      },
    })
    expect(connection.getPageType()).toBe('dashboards')
    mockHostBuilder.fireEventForHandler('page:changed', {
      page: {
        url: '/embed/looks/42?embed_domain=http://localhost:9876&sdk=3',
      },
    })
    expect(connection.getPageType()).toBe('looks')
    mockHostBuilder.fireEventForHandler('page:changed', {
      page: {
        url: '/embed/extensions/myproj::myapp?embed_domain=http://localhost:9876&sdk=3',
      },
    })
    expect(connection.getPageType()).toBe('extensions')
    mockHostBuilder.fireEventForHandler('page:changed', {
      page: {
        url: '/embed/preload?embed_domain=http://localhost:9876&sdk=3',
      },
    })
    expect(connection.getPageType()).toBe('preload')
    mockHostBuilder.fireEventForHandler('page:changed')
    expect(connection.getPageType()).toBe('unknown')
  })

  it('stops running dashboards when loading url', async () => {
    const connection = await getConnection()
    const chattySendAndReceiveSpy = spyOn(
      mockChattyHostConnection,
      'sendAndReceive'
    ).and.callThrough()
    const chattySendSpy = spyOn(
      mockChattyHostConnection,
      'send'
    ).and.callThrough()
    let loadPromise = connection.loadDashboard('42')
    mockHostBuilder.fireEventForHandler('page:changed', {
      page: {
        lookerVersion: '25.1.0',
        url: '/embed/dashboards/42?embed_domain=http://localhost:9876&sdk=3',
      },
    })
    await loadPromise
    expect(chattySendAndReceiveSpy).toHaveBeenCalledWith('page:load', {
      pushHistory: false,
      url: '/embed/dashboards/42?embed_domain=http://localhost:9876&sdk=3',
    })
    loadPromise = connection.loadDashboard('43')
    mockHostBuilder.fireEventForHandler('page:changed', {
      page: {
        lookerVersion: '25.1.0',
        url: '/embed/dashboards/43?embed_domain=http://localhost:9876&sdk=3',
      },
    })
    await loadPromise
    expect(chattySendSpy).toHaveBeenCalledWith('dashboard:stop', undefined)
  })

  it('updates the isEditing indicator for dashboards', async () => {
    const connection = await getConnection()
    const loadPromise = connection.loadDashboard('42')
    mockHostBuilder.fireEventForHandler('page:changed', {
      page: {
        lookerVersion: '25.1.0',
        url: '/embed/dashboards/42?embed_domain=http://localhost:9876&sdk=3',
      },
    })
    await loadPromise
    expect(connection.isEditing()).toBe(false)
    mockHostBuilder.fireEventForHandler('dashboard:edit:start', {})
    expect(connection.isEditing()).toBe(true)
    mockHostBuilder.fireEventForHandler('dashboard:edit:cancel', {})
    expect(connection.isEditing()).toBe(false)
    mockHostBuilder.fireEventForHandler('dashboard:edit:start', {})
    expect(connection.isEditing()).toBe(true)
    mockHostBuilder.fireEventForHandler('dashboard:save:complete', {})
    expect(connection.isEditing()).toBe(false)
  })

  describe('legacy api', () => {
    it('fires legacy dashboard:load event', async () => {
      const connection = await getConnection({ dashboardId: '42' })
      const chattySendAndReceiveSpy = spyOn(
        mockChattyHostConnection,
        'sendAndReceive'
      ).and.callThrough()
      mockHostBuilder.fireEventForHandler('page:changed', {
        page: {
          url: '/embed/dashboards/42?embed_domain=http://localhost:9876&sdk=3',
        },
      })
      connection.loadDashboard('43')
      expect(chattySendAndReceiveSpy).toHaveBeenCalledWith('dashboard:load', {
        id: '43',
        pushHistory: false,
      })
    })

    it('fires legacy run event', async () => {
      const connection = await getConnection({ dashboardId: '42' })
      const chattySendSpy = spyOn(
        mockChattyHostConnection,
        'send'
      ).and.callThrough()
      mockHostBuilder.fireEventForHandler('page:changed', {
        page: {
          url: '/embed/dashboards/42?embed_domain=http://localhost:9876&sdk=3',
        },
      })
      connection.run()
      expect(chattySendSpy).toHaveBeenCalledWith('dashboard:run', undefined)
      mockHostBuilder.fireEventForHandler('page:changed', {
        page: {
          url: '/embed/explore/myexplore/myview?embed_domain=http://localhost:9876&sdk=3',
        },
      })
      chattySendSpy.calls.reset()
      connection.run()
      expect(chattySendSpy).toHaveBeenCalledWith('look:run', undefined)
      mockHostBuilder.fireEventForHandler('page:changed', {
        page: {
          url: '/embed/looks/42?embed_domain=http://localhost:9876&sdk=3',
        },
      })
      chattySendSpy.calls.reset()
      connection.run()
      expect(chattySendSpy).toHaveBeenCalledWith('look:run', undefined)
    })

    it('fires legacy stop event', async () => {
      const connection = await getConnection({ dashboardId: '42' })
      const chattySendSpy = spyOn(
        mockChattyHostConnection,
        'send'
      ).and.callThrough()
      mockHostBuilder.fireEventForHandler('page:changed', {
        page: {
          url: '/embed/dashboards/42?embed_domain=http://localhost:9876&sdk=3',
        },
      })
      connection.stop()
      expect(chattySendSpy).toHaveBeenCalledWith('dashboard:stop', undefined)
    })

    it('fires legacy edit event', async () => {
      const connection = await getConnection({ dashboardId: '42' })
      const chattySendSpy = spyOn(
        mockChattyHostConnection,
        'send'
      ).and.callThrough()
      mockHostBuilder.fireEventForHandler('page:changed', {
        page: {
          url: '/embed/dashboards/42?embed_domain=http://localhost:9876&sdk=3',
        },
      })
      connection.edit()
      expect(chattySendSpy).toHaveBeenCalledWith('dashboard:edit', undefined)
    })

    it('fires legacy update filter event', async () => {
      const connection = await getConnection({ dashboardId: '42' })
      const chattySendSpy = spyOn(
        mockChattyHostConnection,
        'send'
      ).and.callThrough()
      mockHostBuilder.fireEventForHandler('page:changed', {
        page: {
          url: '/embed/dashboards/42?embed_domain=http://localhost:9876&sdk=3',
        },
      })
      connection.updateFilters({ state: 'CA' })
      expect(chattySendSpy).toHaveBeenCalledWith('dashboard:filters:update', {
        filters: {
          state: 'CA',
        },
      })
      mockHostBuilder.fireEventForHandler('page:changed', {
        page: {
          url: '/embed/explore/myexplore/myview?embed_domain=http://localhost:9876&sdk=3',
        },
      })
      chattySendSpy.calls.reset()
      connection.updateFilters({ state: 'CA' })
      expect(chattySendSpy).toHaveBeenCalledWith('look:filters:update', {
        filters: {
          state: 'CA',
        },
      })
      mockHostBuilder.fireEventForHandler('page:changed', {
        page: {
          url: '/embed/looks/42?embed_domain=http://localhost:9876&sdk=3',
        },
      })
      chattySendSpy.calls.reset()
      connection.updateFilters({ state: 'CA' })
      expect(chattySendSpy).toHaveBeenCalledWith('look:filters:update', {
        filters: {
          state: 'CA',
        },
      })
    })

    it('fires legacy set options event', async () => {
      const connection = await getConnection({ dashboardId: '42' })
      const chattySendSpy = spyOn(
        mockChattyHostConnection,
        'send'
      ).and.callThrough()
      mockHostBuilder.fireEventForHandler('page:changed', {
        page: {
          url: '/embed/dashboards/42?embed_domain=http://localhost:9876&sdk=3',
        },
      })
      connection.setOptions({ elements: {}, layouts: [] })
      expect(chattySendSpy).toHaveBeenCalledWith('dashboard:options:set', {
        elements: {},
        layouts: [],
      })
    })

    it('fires legacy set open schedule dialog event', async () => {
      const connection = await getConnection({ dashboardId: '42' })
      const chattySendAndReceiveSpy = spyOn(
        mockChattyHostConnection,
        'sendAndReceive'
      ).and.callThrough()
      mockHostBuilder.fireEventForHandler('page:changed', {
        page: {
          url: '/embed/dashboards/42?embed_domain=http://localhost:9876&sdk=3',
        },
      })
      connection.openScheduleDialog()
      expect(chattySendAndReceiveSpy).toHaveBeenCalledWith(
        'dashboard:schedule_modal:open',
        undefined
      )
    })
  })
})
