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

import type { EmbedBuilderEx } from '../../src/v2/EmbedBuilderEx'
import {
  LookerEmbedExSDK,
  getEmbedSDK,
  createChattyBuilder,
} from '../../src/v2/LookerEmbedExSDK'

describe('LookerEmbedExSDK', () => {
  it('returns the same instance of the embed SDK and that it can be overridden', () => {
    const sdk = getEmbedSDK()
    expect(getEmbedSDK()).toBe(sdk)
    const overrideSdk = new LookerEmbedExSDK()
    expect(getEmbedSDK(overrideSdk)).toBe(overrideSdk)
  })

  it('creates a chatty host builder', () => {
    expect(createChattyBuilder('/embed/preload')).toBeDefined()
  })

  it('can override chatty builder', () => {
    const chattyHostCreator = jasmine.createSpy()
    const sdk = new LookerEmbedExSDK(chattyHostCreator)
    expect(sdk.chattyHostCreator === chattyHostCreator).toBeTruthy()
  })

  it('does its best to sanitize the apiHostUrl', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com')
    expect(sdk._apiHost).toBe('myhost.com')
    sdk.init('https://myhost.com')
    expect(sdk._apiHost).toBe('myhost.com')
    sdk.init('https://myhost.com:9999')
    expect(sdk._apiHost).toBe('myhost.com:9999')
    sdk.init('https://myhost.com:443')
    expect(sdk._apiHost).toBe('myhost.com')
    sdk.init('http://myhost.com')
    expect(sdk._apiHost).toBe('myhost.com')
    sdk.init('http://myhost.com/xxx')
    expect(sdk._apiHost).toBe('myhost.com')
    expect(() => {
      sdk.init('myhost.com::9999')
    }).toThrowError('Invalid host URL myhost.com::9999')
  })

  it('initializes signed URL SDK with string auth', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com', '/auth')
    expect(sdk._acquireSession).toBeUndefined()
    expect(sdk._generateTokens).toBeUndefined()
    expect(sdk._apiHost).toBe('myhost.com')
    expect(sdk._auth).toEqual({ url: '/auth' })
  })

  it('initializes signed URL SDK with auth config', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com', { headers: [], url: '/auth' })
    expect(sdk._acquireSession).toBeUndefined()
    expect(sdk._generateTokens).toBeUndefined()
    expect(sdk._apiHost).toBe('myhost.com')
    expect(sdk._auth).toEqual({ headers: [], url: '/auth' })
  })

  it('can use withApiHost and withAuthUrl methods to initialize sdk', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.preload().withApiHost('myhost.com').withAuthUrl('/auth')
    expect(sdk._acquireSession).toBeUndefined()
    expect(sdk._generateTokens).toBeUndefined()
    expect(sdk._apiHost).toBe('myhost.com')
    expect(sdk._auth).toEqual({ url: '/auth' })
  })

  it('can use withApiHost and withAuth methods to initialize sdk', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.preload().withApiHost('myhost.com').withAuth({ url: '/auth' })
    expect(sdk._acquireSession).toBeUndefined()
    expect(sdk._generateTokens).toBeUndefined()
    expect(sdk._apiHost).toBe('myhost.com')
    expect(sdk._auth).toEqual({ url: '/auth' })
  })

  it('prevents withAuthUrl from being used more than once', () => {
    const sdk = new LookerEmbedExSDK()
    expect(() => {
      sdk
        .preload()
        .withApiHost('myhost.com')
        .withAuthUrl('/auth')
        .withAuthUrl('/auth2')
    }).toThrowError('not allowed to change auth url')
  })

  it('prevents withAuth from being used more than once', () => {
    const sdk = new LookerEmbedExSDK()
    expect(() => {
      sdk
        .preload()
        .withApiHost('myhost.com')
        .withAuth({ url: '/auth' })
        .withAuth({ url: '/auth2' })
    }).toThrowError('not allowed to change auth url')
  })

  it('prevents withApiHost from being used more than once', () => {
    const sdk = new LookerEmbedExSDK()
    expect(() => {
      sdk
        .preload()
        .withApiHost('myhost.com')
        .withAuthUrl('/auth')
        .withApiHost('anotherhost.com')
    }).toThrowError('not allowed to change api host')
  })

  it('adds sandboxed_host to params', () => {
    const sdk = new LookerEmbedExSDK()
    const builder = sdk.preload() as EmbedBuilderEx
    builder.sandboxedHost = true
    builder.withApiHost('myhost.com').withAuthUrl('/auth')
    expect(builder.embedUrl).toBe(
      '/embed/preload/?embed_domain=myhost.com&sandboxed_host=true'
    )
  })

  it('initializes cookieless SDK', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.initCookieless('myhost.com', '/acquire', '/generate')
    expect(sdk._acquireSession).toBe('/acquire')
    expect(sdk._generateTokens).toBe('/generate')
    expect(sdk._apiHost).toBe('myhost.com')
    expect(sdk._auth).toBeUndefined()
  })

  it('creates preload builder', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com', '/auth')
    const builder = sdk.preload() as EmbedBuilderEx
    expect(builder.type).toBe('')
    expect(builder.endpoint).toBe('')
    expect(builder.embedUrl).toBe('/embed/preload/')
    expect(builder.acquireSession).toBe('')
    expect(builder.generateTokens).toBe('')
    expect(builder.isCookielessEmbed).toBeFalsy()
    expect(builder.apiHost).toBe('myhost.com')
    expect(builder.auth).toEqual({ url: '/auth' })
  })

  it('creates dashboard with url builder', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com', '/auth')
    const builder = sdk.createDashboardWithUrl(
      '/embed/dashboards/42?state=california'
    ) as EmbedBuilderEx
    expect(builder.type).toBe('dashboard')
    expect(builder.endpoint).toBe('')
    expect(builder.embedUrl).toBe('/embed/dashboards/42?state=california')
  })

  it('creates dashboard with id builder', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com', '/auth')
    const builder = sdk.createDashboardWithId('42') as EmbedBuilderEx
    expect(builder.type).toBe('dashboard')
    expect(builder.endpoint).toBe('/embed/dashboards')
    expect(builder.id).toBe('42')
    expect(builder.embedUrl).toBe('/embed/dashboards/42')
  })

  it('creates explore with url builder', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com', '/auth')
    const builder = sdk.createExploreWithUrl(
      '/embed/explore/mymodel/myview?state=california'
    ) as EmbedBuilderEx
    expect(builder.type).toBe('explore')
    expect(builder.endpoint).toBe('')
    expect(builder.embedUrl).toBe(
      '/embed/explore/mymodel/myview?state=california'
    )
  })

  it('creates explore with id builder and converts legacy id', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com', '/auth')
    const builder = sdk.createExploreWithId('mymodel::myview') as EmbedBuilderEx
    expect(builder.type).toBe('explore')
    expect(builder.endpoint).toBe('/embed/explore')
    expect(builder.id).toBe('mymodel/myview')
    expect(builder.embedUrl).toBe('/embed/explore/mymodel/myview')
  })

  it('creates explore with id builder', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com', '/auth')
    const builder = sdk.createExploreWithId('mymodel/myview') as EmbedBuilderEx
    expect(builder.type).toBe('explore')
    expect(builder.endpoint).toBe('/embed/explore')
    expect(builder.id).toBe('mymodel/myview')
    expect(builder.embedUrl).toBe('/embed/explore/mymodel/myview')
  })

  it('creates look with url builder', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com', '/auth')
    const builder = sdk.createLookWithUrl(
      '/embed/looks/42?state=california'
    ) as EmbedBuilderEx
    expect(builder.type).toBe('look')
    expect(builder.endpoint).toBe('')
    expect(builder.embedUrl).toBe('/embed/looks/42?state=california')
  })

  it('creates look with id builder', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com', '/auth')
    const builder = sdk.createLookWithId('42') as EmbedBuilderEx
    expect(builder.type).toBe('look')
    expect(builder.endpoint).toBe('/embed/looks')
    expect(builder.id).toBe('42')
    expect(builder.embedUrl).toBe('/embed/looks/42')
  })

  it('creates extension with url builder', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com', '/auth')
    const builder = sdk.createExtensionWithUrl(
      '/embed/extensions/myproj::myext/?state=california'
    ) as EmbedBuilderEx
    expect(builder.type).toBe('extension')
    expect(builder.endpoint).toBe('')
    expect(builder.embedUrl).toBe(
      '/embed/extensions/myproj::myext/?state=california'
    )
  })

  it('creates extension with id builder', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com', '/auth')
    const builder = sdk.createExtensionWithId('myproj::myext') as EmbedBuilderEx
    expect(builder.type).toBe('extension')
    expect(builder.endpoint).toBe('/embed/extensions')
    expect(builder.id).toBe('myproj::myext')
    expect(builder.embedUrl).toBe('/embed/extensions/myproj::myext')
  })
})
