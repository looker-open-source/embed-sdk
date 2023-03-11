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

import { LookerEmbedDashboard } from '../src/dashboard_client'
import { EmbedClient } from '../src/embed'
import type { EmbedBuilder } from '../src/embed_builder'
import { LookerEmbedExplore } from '../src/explore_client'
import type { LookerEmbedCookielessSessionData } from '../src/index'
import { LookerEmbedSDK } from '../src/index'
import { LookerEmbedLook } from '../src/look_client'
import { LookerEmbedExtension } from '../src/extension_client'

describe('LookerEmbedBuilder', () => {
  let builder: EmbedBuilder<any>
  let el: HTMLDivElement

  const dashboardId = '11'

  beforeEach(() => {
    LookerEmbedSDK.init('host.looker.com:9999', '/auth')
    el = document.createElement('div')
    el.id = 'the-element'
    document.body.append(el)
  })

  afterEach(() => {
    document.body.removeChild(el)
  })

  describe('dashboards with ID', () => {
    beforeEach(() => {
      builder = LookerEmbedSDK.createDashboardWithId(dashboardId)
    })

    it('should create a dashboard instance', () => {
      expect(builder.type).toEqual('dashboard')
      expect(builder.clientConstructor).toEqual(LookerEmbedDashboard)
    })

    it('should generate a dashboard URL', () => {
      expect(builder.embedUrl).toMatch(`/embed/dashboards/${dashboardId}`)
    })

    it('should generate a next generation dashboard URL', () => {
      builder = builder.withNext()
      expect(builder.embedUrl).toMatch(`/embed/dashboards-next/${dashboardId}`)
    })

    it('should generate a dashboard URL with a provided suffix', () => {
      builder = builder.withNext('-beta')
      expect(builder.embedUrl).toMatch(`/embed/dashboards-beta/${dashboardId}`)
    })

    it('should generate a dashboard URL with the requested filters', () => {
      const filterName = 'My_Number'
      const filterValue = '123'
      builder.withFilters({ [filterName]: filterValue })
      expect(builder.embedUrl).toMatch(`&${filterName}=${filterValue}`)
    })

    it('should generate a dashboard URL with the requested named theme', () => {
      const themeName = 'My_Theme'
      builder.withTheme(themeName)
      expect(builder.embedUrl).toMatch(`&theme=${themeName}`)
    })
  })

  describe('dashboards with URL', () => {
    beforeEach(() => {
      builder = LookerEmbedSDK.createDashboardWithUrl(
        'https://host.looker.com:9999/login/embed/etc'
      )
    })

    it('should create a dashboard instance', () => {
      expect(builder.type).toEqual('dashboard')
      expect(builder.clientConstructor).toEqual(LookerEmbedDashboard)
    })

    it('should return the URL', () => {
      expect(builder.url).toEqual(
        'https://host.looker.com:9999/login/embed/etc'
      )
    })
  })

  describe('looks with ID', () => {
    beforeEach(() => {
      builder = LookerEmbedSDK.createLookWithId(11)
    })

    it('should create a look instance', () => {
      expect(builder.type).toEqual('look')
      expect(builder.clientConstructor).toEqual(LookerEmbedLook)
    })

    it('should generate a look URL', () => {
      expect(builder.embedUrl).toMatch('/embed/looks/11')
    })
  })

  describe('looks with URL', () => {
    beforeEach(() => {
      builder = LookerEmbedSDK.createLookWithUrl(
        'https://host.looker.com:9999/login/embed/etc'
      )
    })

    it('should create a look instance', () => {
      expect(builder.type).toEqual('look')
      expect(builder.clientConstructor).toEqual(LookerEmbedLook)
    })

    it('should generate a look URL', () => {
      expect(builder.url).toEqual(
        'https://host.looker.com:9999/login/embed/etc'
      )
    })
  })

  describe('explores with ID', () => {
    beforeEach(() => {
      builder = LookerEmbedSDK.createExploreWithId('alpha/beta')
    })

    it('should create an explore instance', () => {
      expect(builder.type).toEqual('explore')
      expect(builder.clientConstructor).toEqual(LookerEmbedExplore)
    })

    it('should generate an explore URL', () => {
      expect(builder.embedUrl).toMatch('/embed/explore/alpha/beta')
    })
  })

  describe('explores with old style ID', () => {
    beforeEach(() => {
      builder = LookerEmbedSDK.createExploreWithId('alpha::beta')
    })

    it('should create an explore instance', () => {
      expect(builder.type).toEqual('explore')
      expect(builder.clientConstructor).toEqual(LookerEmbedExplore)
    })

    it('should generate an explore URL', () => {
      expect(builder.embedUrl).toMatch('/embed/explore/alpha/beta')
    })
  })

  describe('explores with URL', () => {
    beforeEach(() => {
      builder = LookerEmbedSDK.createExploreWithUrl(
        'https://host.looker.com:9999/login/embed/etc'
      )
    })

    it('should create an explore instance', () => {
      expect(builder.type).toEqual('explore')
      expect(builder.clientConstructor).toEqual(LookerEmbedExplore)
    })

    it('should generate a explore URL', () => {
      expect(builder.url).toEqual(
        'https://host.looker.com:9999/login/embed/etc'
      )
    })
  })

  describe('extension with ID', () => {
    beforeEach(() => {
      builder = LookerEmbedSDK.createExtensionWithId('kitchensink::kitchensink')
    })

    it('should create an extension instance', () => {
      expect(builder.type).toEqual('extension')
      expect(builder.clientConstructor).toEqual(LookerEmbedExtension)
    })

    it('should generate an extension URL', () => {
      expect(builder.embedUrl).toMatch(
        '/embed/extensions/kitchensink::kitchensink'
      )
    })
  })

  describe('extension with URL', () => {
    beforeEach(() => {
      builder = LookerEmbedSDK.createExtensionWithUrl(
        'https://host.looker.com:9999/login/embed/etc'
      )
    })

    it('should create an extension instance', () => {
      expect(builder.type).toEqual('extension')
      expect(builder.clientConstructor).toEqual(LookerEmbedExtension)
    })

    it('should generate a extension URL', () => {
      expect(builder.url).toEqual(
        'https://host.looker.com:9999/login/embed/etc'
      )
    })
  })

  describe('parameters', () => {
    beforeEach(() => {
      builder = LookerEmbedSDK.createDashboardWithId(11)
    })

    it('should add an on<action> handler', () => {
      const dance = jasmine.createSpy('dance')
      builder.on('party', dance)
      expect(builder.handlers.party).toEqual([dance])
    })

    it('should add a second on<action> handler', () => {
      const dance = jasmine.createSpy('dance')
      const pizza = jasmine.createSpy('pizza')
      builder.on('party', dance)
      builder.on('party', pizza)
      expect(builder.handlers.party).toEqual([dance, pizza])
    })

    it('should add url parameters', () => {
      builder.withParams({ alpha: '1', beta: '2' })
      expect(builder.embedUrl).toMatch('alpha=1&beta=2')
    })

    it('should allow specifying a theme', () => {
      builder.withTheme('Fancy')
      expect(builder.embedUrl).toMatch('theme=Fancy')
    })

    it('should allow specifying filters for dashboards', () => {
      builder.withFilters({ 'State / Region': 'California' })
      expect(builder.embedUrl).toMatch('State%20%2F%20Region=California')
    })

    it('should allow specifying filters for looks', () => {
      builder = LookerEmbedSDK.createLookWithId(1)
      builder.withFilters({ 'State / Region': 'California' })
      expect(builder.embedUrl).toMatch('f%5BState%20%2F%20Region%5D=California')
    })

    it('should allow adding sandbox attributes', () => {
      builder.withSandboxAttr('alpha')
      builder.withSandboxAttr('beta')
      expect(builder.sandboxAttrs).toEqual(['alpha', 'beta'])
    })

    it('should allow adding several sandbox attributes at once', () => {
      builder.withSandboxAttr('alpha', 'beta')
      expect(builder.sandboxAttrs).toEqual(['alpha', 'beta'])
    })

    it('should allow adding allow attributes', () => {
      builder.withAllowAttr('alpha')
      builder.withAllowAttr('beta')
      expect(builder.allowAttrs).toEqual(['alpha', 'beta'])
    })

    it('should allow adding several allow attributes at once', () => {
      builder.withAllowAttr('alpha', 'beta')
      expect(builder.allowAttrs).toEqual(['alpha', 'beta'])
    })

    it('should allow adding classNames', () => {
      builder.withClassName('alpha')
      builder.withClassName('beta')
      expect(builder.classNames).toEqual(['alpha', 'beta'])
    })

    it('should allow adding several classNames attributes at once', () => {
      builder.withClassName('alpha', 'beta')
      expect(builder.classNames).toEqual(['alpha', 'beta'])
    })

    it('should default to appending to body', () => {
      expect(builder.el).toEqual(document.body)
    })

    it('should allow selecting an element', () => {
      builder.appendTo('#the-element')
      expect(builder.el).toEqual(el)
    })

    it('should allow specifying an element', () => {
      builder.appendTo(el)
      expect(builder.el).toEqual(el)
    })

    it('should default to no frame border', () => {
      expect(builder.frameBorder).toEqual('0')
    })

    it('should allow setting frame border', () => {
      builder.withFrameBorder('1')
      expect(builder.frameBorder).toEqual('1')
    })

    it('should return the api host', () => {
      expect(builder.apiHost).toEqual('host.looker.com:9999')
    })

    it('should return the auth url', () => {
      // tslint:disable-next-line:deprecation
      expect(builder.authUrl).toEqual('/auth')
    })

    it('should return the auth config', () => {
      // tslint:disable-next-line:deprecation
      expect(builder.auth).toEqual({ url: '/auth' })
    })

    it('should return the scrollMonitor config', () => {
      builder.withScrollMonitor()
      expect(builder.scrollMonitor).toEqual(true)
    })

    it('should return the dynamicIFrameHeight config', () => {
      builder.withDynamicIFrameHeight()
      expect(builder.dynamicIFrameHeight).toEqual(true)
    })

    it('should return the dialogScroll config', () => {
      builder.withDialogScroll()
      expect(builder.dialogScroll).toEqual(true)
    })
  })

  describe('build', () => {
    beforeEach(() => {
      builder = LookerEmbedSDK.createDashboardWithId(11)
    })

    it('should create an iframe with the correct attributes and return an embed client', () => {
      const embed = builder.build()
      expect(embed).toEqual(jasmine.any(EmbedClient))
    })
  })

  describe('api host and auth set through embed builder api', () => {
    const host = 'https://host.looker.com:9999'
    const host2 = 'https://host2.looker.com:9999'
    const authUrl = '/auth'
    const authUrl2 = '/auth2'
    const authConfig = {
      headers: [{ name: 'X-Foo', value: 'bar' }],
      params: [{ name: 'baz', value: 'biff' }],
      url: '/auth',
    }
    const authConfig2 = {
      headers: [{ name: 'X-Foo', value: 'bar' }],
      params: [{ name: 'baz', value: 'biff' }],
      url: '/auth2',
    }
    const embedSdk = LookerEmbedSDK

    beforeEach(() => {
      embedSdk.apiHost = undefined
      embedSdk.auth = undefined
      embedSdk.acquireSession = undefined
      embedSdk.generateTokens = undefined
    })

    it('builder allows api host and auth url to be set', () => {
      LookerEmbedSDK.createDashboardWithUrl(
        'https://host.looker.com:9999/login/embed/etc'
      )
        .withApiHost(host)
        .withAuthUrl(authUrl)
      expect(embedSdk.apiHost).toEqual(host)
      expect(embedSdk.auth).toEqual({ url: authUrl })
    })

    it('allows api host and auth url to be specified again', () => {
      LookerEmbedSDK.init(host, authUrl)
      LookerEmbedSDK.createDashboardWithUrl(
        'https://host.looker.com:9999/login/embed/etc'
      )
        .withApiHost(host)
        .withAuthUrl(authUrl)
      expect(embedSdk.apiHost).toEqual(host)
      expect(embedSdk.auth).toEqual({ url: authUrl })
    })

    it('prevents api host and auth url from being overridden', () => {
      LookerEmbedSDK.init(host, authUrl)
      try {
        LookerEmbedSDK.createDashboardWithUrl(
          'https://host.looker.com:9999/login/embed/etc'
        ).withApiHost(host2)
        fail()
      } catch (err) {
        expect(err.message).toEqual('not allowed to change api host')
      }
      try {
        LookerEmbedSDK.createDashboardWithUrl(
          'https://host.looker.com:9999/login/embed/etc'
        ).withAuthUrl(authUrl2)
        fail()
      } catch (err) {
        expect(err.message).toEqual('not allowed to change auth url')
      }
    })

    it('builder allows api host and auth config to be set', () => {
      LookerEmbedSDK.createDashboardWithUrl(
        'https://host.looker.com:9999/login/embed/etc'
      )
        .withApiHost(host)
        .withAuth(authConfig)
      expect(embedSdk.apiHost).toEqual(host)
      expect(embedSdk.auth).toEqual(authConfig)
    })

    it('allows api host and auth config to be specified again', () => {
      LookerEmbedSDK.init(host, authConfig)
      LookerEmbedSDK.createDashboardWithUrl(
        'https://host.looker.com:9999/login/embed/etc'
      )
        .withApiHost(host)
        .withAuth(authConfig)
      expect(embedSdk.apiHost).toEqual(host)
      expect(embedSdk.auth).toEqual(authConfig)
    })

    it('builder allows withCredentials auth config to be set', () => {
      const authWithCredentials = {
        ...authConfig,
        withCredentials: true,
      }
      LookerEmbedSDK.createDashboardWithUrl(
        'https://host.looker.com:9999/login/embed/etc'
      )
        .withApiHost(host)
        .withAuth(authWithCredentials)
      expect(embedSdk.apiHost).toEqual(host)
      expect(embedSdk.auth).toEqual(authWithCredentials)
    })

    it('prevents api host and auth config from being overridden', () => {
      LookerEmbedSDK.init(host, authConfig)
      try {
        LookerEmbedSDK.createDashboardWithUrl(
          'https://host.looker.com:9999/login/embed/etc'
        ).withApiHost(host2)
        fail()
      } catch (err) {
        expect(err.message).toEqual('not allowed to change api host')
      }
      try {
        LookerEmbedSDK.createDashboardWithUrl(
          'https://host.looker.com:9999/login/embed/etc'
        ).withAuth(authConfig2)
        fail()
      } catch (err) {
        expect(err.message).toEqual('not allowed to change auth')
      }
    })
  })

  describe('cookieless embed setup', () => {
    const embedSdk = LookerEmbedSDK

    beforeEach(() => {
      embedSdk.apiHost = undefined
      embedSdk.auth = undefined
      embedSdk.acquireSession = undefined
      embedSdk.generateTokens = undefined
    })

    it('initializes cookieless embed', () => {
      const host = 'host.looker.com:9999'
      const acquireSessionCallback = async () => {
        return {} as LookerEmbedCookielessSessionData
      }
      const generateTokensCallback = async () => {
        return {} as LookerEmbedCookielessSessionData
      }
      LookerEmbedSDK.initCookieless(
        host,
        acquireSessionCallback,
        generateTokensCallback
      )
      expect(embedSdk.acquireSession).toEqual(acquireSessionCallback)
      expect(embedSdk.generateTokens).toEqual(generateTokensCallback)
      expect(embedSdk.apiHost).toEqual(host)
    })
  })
})
