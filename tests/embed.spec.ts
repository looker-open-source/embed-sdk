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

const testUrl = '/base/tests/test.html'

describe('LookerEmbed', () => {
  let builder
  let el
  let client

  beforeEach(() => {
    LookerEmbedSDK.init('host.looker.com:9999', '/auth')
    el = document.createElement('div')
    el.id = 'the-element'
  })

  describe('with ID', () => {
    let fakeDashboardClient

    beforeEach(() => {
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
        .catch(expect(false))
    })

    afterEach(() =>
      mock.teardown()
    )

    it('should only connect once', (done) => {
      client.connect()
        .then(() => false)
        .catch(expect(false))

      client.connect()
        .then(() => {
          expect(client.createIframe.calls.count()).toEqual(1)
          done()
        })
        .catch(expect(false))
    })
  })

  describe('with URL', () => {
    let fakeDashboardClient

    beforeEach(() => {
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
        .catch(expect(false))
    })

    it('should only connect once', (done) => {
      client.connect()
        .then(() => false)
        .catch(expect(false))

      client.connect()
        .then(() => {
          expect(client.createIframe.calls.count()).toEqual(1)
          done()
        })
        .catch(expect(false))
    })
  })

  describe('creating an iframe', () => {
    let fakeDashboardClient
    let el
    let iframe

    beforeEach(() => {
      el = document.createElement('div')
      el.id = 'the-element'
      document.body.append(el)

      fakeDashboardClient = {}
      builder = LookerEmbedSDK.createDashboardWithUrl(testUrl)
      builder.appendTo('#the-element')
      builder.on('dashboard:run:start', () => false)
      builder.withSandboxAttr('allow-scripts')
      builder.withClassName('classy')
      client = builder.build()
      spyOn(window, 'fetch')
      spyOn(ChattyHost.prototype, 'connect').and.callFake(async function () {
        iframe = this.iframe
        return Promise.resolve({})
      })
    })

    afterEach(() => {
      document.body.removeChild(el)
    })

    it('it should create an iframe with the appropriate parameters', (done) => {
      client.connect()
        .then(() => {
          expect(iframe.sandbox.toString()).toEqual('allow-scripts')
          expect(iframe.classList.toString()).toEqual('classy')
          expect(iframe.frameBorder).toEqual('0')
          expect(iframe.src).toMatch(testUrl)
          done()
        })
        .catch(expect(false))
    })
  })
})
