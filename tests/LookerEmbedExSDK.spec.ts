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

import type { EmbedBuilderEx } from '../src/EmbedBuilderEx'
import {
  LookerEmbedExSDK,
  getEmbedSDK,
  createChattyBuilder,
} from '../src/LookerEmbedExSDK'

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
    const chattyHostCreator = jest.fn()
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
    }).toThrow('Invalid host URL myhost.com::9999')
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
    }).toThrow('not allowed to change auth url')
  })

  it('prevents withAuth from being used more than once', () => {
    const sdk = new LookerEmbedExSDK()
    expect(() => {
      sdk
        .preload()
        .withApiHost('myhost.com')
        .withAuth({ url: '/auth' })
        .withAuth({ url: '/auth2' })
    }).toThrow('not allowed to change auth url')
  })

  it('prevents withApiHost from being used more than once', () => {
    const sdk = new LookerEmbedExSDK()
    expect(() => {
      sdk
        .preload()
        .withApiHost('myhost.com')
        .withAuthUrl('/auth')
        .withApiHost('anotherhost.com')
    }).toThrow('not allowed to change api host')
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

  it('can create using a url', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com', '/auth')
    const builder = sdk.createWithUrl('/embed/dashboards/42') as EmbedBuilderEx
    expect(builder.embedUrl).toBe('/embed/dashboards/42')
  })

  it('creates preload builder', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com', '/auth')
    const builder = sdk.preload() as EmbedBuilderEx
    expect(builder.type).toBe('preload')
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
    expect(builder.type).toBe('dashboards')
    expect(builder.endpoint).toBe('')
    expect(builder.embedUrl).toBe('/embed/dashboards/42?state=california')
  })

  it('creates dashboard with id builder', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com', '/auth')
    const builder = sdk.createDashboardWithId('42') as EmbedBuilderEx
    expect(builder.type).toBe('dashboards')
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
    expect(builder.type).toBe('looks')
    expect(builder.endpoint).toBe('')
    expect(builder.embedUrl).toBe('/embed/looks/42?state=california')
  })

  it('creates look with id builder', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com', '/auth')
    const builder = sdk.createLookWithId('42') as EmbedBuilderEx
    expect(builder.type).toBe('looks')
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
    expect(builder.type).toBe('extensions')
    expect(builder.endpoint).toBe('')
    expect(builder.embedUrl).toBe(
      '/embed/extensions/myproj::myext/?state=california'
    )
  })

  it('creates extension with id builder', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com', '/auth')
    const builder = sdk.createExtensionWithId('myproj::myext') as EmbedBuilderEx
    expect(builder.type).toBe('extensions')
    expect(builder.endpoint).toBe('/embed/extensions')
    expect(builder.id).toBe('myproj::myext')
    expect(builder.embedUrl).toBe('/embed/extensions/myproj::myext')
  })

  it('creates report with url builder', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com', '/auth')
    const builder = sdk.createReportWithUrl(
      '/embed/reporting/0123456780abcdef'
    ) as EmbedBuilderEx
    expect(builder.type).toBe('reporting')
    expect(builder.endpoint).toBe('')
    expect(builder.embedUrl).toBe('/embed/reporting/0123456780abcdef')
  })

  it('creates report with id builder', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com', '/auth')
    const builder = sdk.createReportWithId('0123456780abcdef') as EmbedBuilderEx
    expect(builder.type).toBe('reporting')
    expect(builder.endpoint).toBe('/embed/reporting')
    expect(builder.embedUrl).toBe('/embed/reporting/0123456780abcdef')
  })

  it('creates query visualization with url builder', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com', '/auth')
    const builder = sdk.createQueryVisualizationWithUrl(
      '/embed/query-visualization/1234567890abcedf'
    ) as EmbedBuilderEx
    expect(builder.type).toBe('query-visualization')
    expect(builder.endpoint).toBe('')
    expect(builder.id).toBeUndefined()
    expect(builder.embedUrl).toBe('/embed/query-visualization/1234567890abcedf')
  })

  it('creates query visualization with id builder', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com', '/auth')
    const builder = sdk.createQueryVisualizationWithId(
      '1234567890abcedf'
    ) as EmbedBuilderEx
    expect(builder.type).toBe('query-visualization')
    expect(builder.endpoint).toBe('/embed/query-visualization')
    expect(builder.id).toBe('1234567890abcedf')
    expect(builder.embedUrl).toBe('/embed/query-visualization/1234567890abcedf')
  })

  it('creates query with url builder', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com', '/auth')
    const builder = sdk.createQueryWithUrl(
      '/embed/query/mymodel/myview?qid=1234567890abcedf'
    ) as EmbedBuilderEx
    expect(builder.type).toBe('query')
    // createQueryWithId is just a convenience wrapper of createQueryWithUrl.
    // as such endpoint and id are not populated.
    expect(builder.endpoint).toBe('')
    expect(builder.id).toBeUndefined()
    expect(builder.embedUrl).toBe(
      '/embed/query/mymodel/myview?qid=1234567890abcedf'
    )
  })

  it('creates query with id builder', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com', '/auth')
    const builder = sdk.createQueryWithId(
      'mymodel',
      'myview',
      '1234567890abcedf'
    ) as EmbedBuilderEx
    expect(builder.type).toBe('query')
    // createQueryWithId is just a convenience wrapper of createQueryWithUrl.
    // as such endpoint and id are not populated.
    expect(builder.endpoint).toBe('')
    expect(builder.id).toBeUndefined()
    expect(builder.embedUrl).toBe(
      '/embed/query/mymodel/myview?qid=1234567890abcedf'
    )
  })

  it('creates merge query with url builder', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com', '/auth')
    const builder = sdk.createMergeQueryWithUrl(
      '/embed/merge?mid=1234567890abcedf'
    ) as EmbedBuilderEx
    expect(builder.type).toBe('merge')
    expect(builder.endpoint).toBe('')
    expect(builder.id).toBeUndefined()
    expect(builder.embedUrl).toBe('/embed/merge?mid=1234567890abcedf')
  })

  it('creates merge query with id builder', () => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com', '/auth')
    const builder = sdk.createMergeQueryWithId(
      '1234567890abcedf'
    ) as EmbedBuilderEx
    expect(builder.type).toBe('merge')
    // createMergeQueryWithId is just a convenience wrapper of createMergeQueryWithUrl.
    // as such endpoint and id are not populated.
    expect(builder.endpoint).toBe('')
    expect(builder.id).toBeUndefined()
    expect(builder.embedUrl).toBe('/embed/merge?mid=1234567890abcedf')
  })
})
