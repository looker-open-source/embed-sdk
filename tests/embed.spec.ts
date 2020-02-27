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

import { LookerEmbedSDK, LookerEmbedDashboard } from '../src/index'
import { ChattyHost } from '@looker/chatty'
import mock from 'xhr-mock'
import { EmbedBuilder } from '../src/embed_builder'

const testUrl = '/base/tests/test.html'

describe('LookerEmbed', () => {
  let builder: EmbedBuilder<any>
  let el: HTMLDivElement
  let client: any

  beforeEach(() => {
    el = document.createElement('div')
    el.id = 'the-element'
    document.body.append(el)
  })

  afterEach(() => {
    document.body.removeChild(el)
  })

  describe('targetOrigin', () => {
    it('accepts a host:port for apiHost', () => {
      LookerEmbedSDK.init('host.looker.com:9999')

      builder = LookerEmbedSDK.createDashboardWithId(11)
      client = builder.build()

      expect(client.targetOrigin).toEqual('https://host.looker.com:9999')
    })

    it('accepts https://host:port for apiHost', () => {
      LookerEmbedSDK.init('https://host.looker.com:9999')

      builder = LookerEmbedSDK.createDashboardWithId(11)
      client = builder.build()

      expect(client.targetOrigin).toEqual('https://host.looker.com:9999')
    })

    it('accepts http://host:port for apiHost', () => {
      LookerEmbedSDK.init('http://host.looker.com:9999')

      builder = LookerEmbedSDK.createDashboardWithId(11)
      client = builder.build()

      expect(client.targetOrigin).toEqual('http://host.looker.com:9999')
    })
  })

  describe('with ID', () => {
    let fakeDashboardClient: any

    beforeEach(() => {
      LookerEmbedSDK.init('host.looker.com:9999', '/auth')

      mock.setup()
      mock.get(/\/auth\?src=/, (req, res) => {
        expect(req.header('Cache-Control')).toEqual('no-cache')
        return res.status(200).body(`{"url": "${testUrl}"}`)
      })
      fakeDashboardClient = {}
      builder = LookerEmbedSDK.createDashboardWithId(11)
      client = builder.build()
      spyOn<any>(client, 'createIframe').and.returnValue(Promise.resolve(fakeDashboardClient))
    })

    it('should contact the auth endpoint to build the URL', (done) => {
      client.connect()
        .then((dashboard: LookerEmbedDashboard) => {
          expect(dashboard).toEqual(fakeDashboardClient)
          expect(client.createIframe).toHaveBeenCalledWith(testUrl)
          expect(client.isConnected).toBe(true)
          expect(client.connection).not.toEqual(null)
          done()
        })
        .catch(done.fail)
    })

    afterEach(() =>
      mock.teardown()
    )

    it('should only connect once', (done) => {
      client.connect()
        .then(() => false)
        .catch(done.fail)

      client.connect()
        .then(() => {
          expect(client.createIframe.calls.count()).toEqual(1)
          done()
        })
        .catch(done.fail)
    })

    it('should handle failures', (done) => {
      mock.reset()
      mock.get(/\/auth\?src=/, (req, res) => {
        expect(req.header('Cache-Control')).toEqual('no-cache')
        return res.status(403).reason('foo')
      })

      client.connect()
        .then(done.fail)
        .catch((error: any) => {
          expect(error).toEqual('foo')
          done()
        })
    })
  })

  describe('with URL', () => {
    let fakeDashboardClient: any

    beforeEach(() => {
      LookerEmbedSDK.init('host.looker.com:9999', '/auth')

      fakeDashboardClient = {}
      builder = LookerEmbedSDK.createDashboardWithUrl(testUrl)
      client = builder.build()
      spyOn(window, 'fetch')
      spyOn<any>(client, 'createIframe').and.returnValue(Promise.resolve(fakeDashboardClient))
    })

    it('should not contact the auth endpoint to build the URL', (done) => {
      client.connect()
        .then((dashboard: LookerEmbedDashboard) => {
          expect(dashboard).toEqual(fakeDashboardClient)
          expect(window.fetch).not.toHaveBeenCalled()
          expect(client.createIframe).toHaveBeenCalledWith(testUrl)
          expect(client.isConnected).toBe(true)
          expect(client.connection).not.toEqual(null)
          done()
        })
        .catch(done.fail)
    })

    it('should only connect once', (done) => {
      client.connect()
        .then(() => false)
        .catch(done.fail)

      client.connect()
        .then(() => {
          expect(client.createIframe.calls.count()).toEqual(1)
          done()
        })
        .catch(done.fail)
    })
  })

  describe('creating an iframe', () => {
    let fakeDashboardClient
    let iframe: HTMLIFrameElement

    beforeEach(() => {
      LookerEmbedSDK.init('host.looker.com:9999', '/auth')

      fakeDashboardClient = {}
      builder = LookerEmbedSDK.createDashboardWithUrl(testUrl)
      builder.appendTo('#the-element')
      builder.on('dashboard:run:start', () => false)
      builder.withSandboxAttr('allow-scripts')
      builder.withClassName('classy')
      client = builder.build()
      spyOn(window, 'fetch')
      spyOn(ChattyHost.prototype, 'connect').and.callFake(async function (this: any) {
        iframe = this.iframe
        return Promise.resolve({})
      })
    })

    it('it should create an iframe with the appropriate parameters', (done) => {
      client.connect()
        .then(() => {
          expect(iframe.sandbox.toString()).toEqual('allow-scripts')
          expect(iframe.classList.toString()).toEqual('classy')
          // tslint:disable-next-line:deprecation
          expect(iframe.frameBorder).toEqual('0')
          expect(iframe.src).toMatch(testUrl)
          done()
        })
        .catch(done.fail)
    })
  })

  describe('creating an iframe in a sandboxed environment', () => {
    let fakeDashboardClient
    let iframe: HTMLIFrameElement

    beforeEach(() => {
      spyOn(EmbedBuilder.prototype, 'sandboxedHost').and.returnValue(true)
      spyOn(window, 'fetch')
      spyOn(ChattyHost.prototype, 'connect').and.callFake(async function (this: any) {
        iframe = this.iframe
        return Promise.resolve({})
      })

      LookerEmbedSDK.init('https://host.looker.com:9999')
      fakeDashboardClient = {}
      builder = LookerEmbedSDK.createDashboardWithId(11)
      builder.appendTo('#the-element')
      client = builder.build()
    })

    it('prefixes iframe src with host url and sets targetOrigin to *', (done) => {
      client.connect()
        .then(() => {
          expect(client.targetOrigin).toEqual('*')
          expect(iframe.src).toEqual('https://host.looker.com:9999/embed/dashboards/11?embed_domain=https%3A%2F%2Fhost.looker.com%3A9999&sdk=2&sandboxed_host=true')
          done()
        })
        .catch(done.fail)
    })
  })

  describe('creating an iframe in a sandboxed environment using withAppHost', () => {
    let fakeDashboardClient
    let iframe: HTMLIFrameElement
    const embedSdk = LookerEmbedSDK as any

    beforeEach(() => {
      spyOn(EmbedBuilder.prototype, 'sandboxedHost').and.returnValue(true)
      spyOn(window, 'fetch')
      spyOn(ChattyHost.prototype, 'connect').and.callFake(async function (this: any) {
        iframe = this.iframe
        return Promise.resolve({})
      })

      embedSdk.apiHost = undefined
      embedSdk.authUrl = undefined

      fakeDashboardClient = {}
      client = LookerEmbedSDK.createDashboardWithId(11)
        .withApiHost('https://host.looker.com:9999')
        .appendTo('#the-element')
        .build()
    })

    it('sets embed domain to the api host', (done) => {
      client.connect()
        .then(() => {
          expect(iframe.src).toEqual('https://host.looker.com:9999/embed/dashboards/11?embed_domain=https%3A%2F%2Fhost.looker.com%3A9999&sdk=2&sandboxed_host=true')
          done()
        })
        .catch(done.fail)
    })
  })

  describe('receiving messages', () => {
    let mockDashboardClient: any
    let embedDashboard: any

    const startFn = jasmine.createSpy('onStart').and.callFake(function () {
      expect(this).toEqual(embedDashboard)
    })
    const mockStartData = { dashboard: { id: '1' } }

    beforeEach(() => {
      spyOn(ChattyHost.prototype, 'connect').and.callFake(async function (this: any) {
        return Promise.resolve({})
      })
      mockDashboardClient = {}
      builder = LookerEmbedSDK.createDashboardWithUrl(testUrl)
      builder.on('dashboard:run:start', startFn)
      client = builder.build()
    })

    it('should call the callback with the passed data and this set to client.', (done) => {
      const connection = client.connect()
      connection.then((dashboard: LookerEmbedDashboard) => {
        embedDashboard = dashboard
        client._host._handlers['dashboard:run:start'][0].call(null, mockStartData)
        expect(startFn).toHaveBeenCalledWith(mockStartData)
        done()
      })
      .catch(done.fail)
    })

  })
})
