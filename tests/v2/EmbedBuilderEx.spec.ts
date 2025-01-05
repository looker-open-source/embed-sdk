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
import { LookerEmbedExSDK } from '../../src/v2/LookerEmbedExSDK'

describe('EmbedBuilderEx', () => {
  let preloadBuilder: EmbedBuilderEx
  let dashboardUrlBuilder: EmbedBuilderEx
  let dashboardIdBuilder: EmbedBuilderEx
  let lookIdBuilder: EmbedBuilderEx

  beforeEach(() => {
    const sdk = new LookerEmbedExSDK()
    sdk.init('myhost.com', '/auth')
    preloadBuilder = sdk.preload() as EmbedBuilderEx
    dashboardUrlBuilder = sdk.createDashboardWithUrl(
      '/embed/dashboards/42'
    ) as EmbedBuilderEx
    dashboardIdBuilder = sdk.createDashboardWithId('42') as EmbedBuilderEx
    lookIdBuilder = sdk.createLookWithId('42') as EmbedBuilderEx
  })

  it('throws an error when withId is used with withUrl', () => {
    expect(() => {
      dashboardUrlBuilder.withId('42')
    }).toThrowError('withId requires initialization of type and endpoint')
  })

  it('can add params', () => {
    dashboardIdBuilder.withParams({
      paramA: 'aValue',
      paramB: ['bValue1', 'bValue2'],
    })
    expect(dashboardIdBuilder.embedUrl).toBe(
      '/embed/dashboards/42?paramA=aValue&paramB=bValue1&paramB=bValue2'
    )
  })

  it('can add filters to a dashboard', () => {
    dashboardIdBuilder.withFilters({
      filterA: 'aValue',
      filterB: 'bValue',
    })
    expect(dashboardIdBuilder.embedUrl).toBe(
      '/embed/dashboards/42?filterA=aValue&filterB=bValue'
    )
  })

  it('can add escaped filters to a dashboard', () => {
    dashboardIdBuilder.withFilters(
      {
        filterA: 'aValue=1',
        filterB: 'bValue=2',
      },
      true
    )
    expect(dashboardIdBuilder.embedUrl).toBe(
      '/embed/dashboards/42?filterA=aValue%3D1&filterB=bValue%3D2'
    )
  })

  it('can add filters to a look', () => {
    lookIdBuilder.withFilters({
      filterA: 'aValue',
      filterB: 'bValue',
    })
    expect(lookIdBuilder.embedUrl).toBe(
      '/embed/looks/42?f%5BfilterA%5D=aValue&f%5BfilterB%5D=bValue'
    )
  })

  it('can add escaped filters to a look', () => {
    lookIdBuilder.withFilters(
      {
        filterA: 'aValue=1',
        filterB: 'bValue=2',
      },
      true
    )
    expect(lookIdBuilder.embedUrl).toBe(
      '/embed/looks/42?f%5BfilterA%5D=aValue%3D1&f%5BfilterB%5D=bValue%3D2'
    )
  })

  it('can add a theme to a dashboard', () => {
    dashboardIdBuilder.withTheme('darcula')
    expect(dashboardIdBuilder.embedUrl).toBe(
      '/embed/dashboards/42?theme=darcula'
    )
  })

  it('can specify a frame border', () => {
    preloadBuilder.withFrameBorder('1')
    expect(preloadBuilder.frameBorder).toBe('1')
  })

  it('can add sandbox attributes', () => {
    preloadBuilder.withSandboxAttr('att1', 'att2')
    preloadBuilder.withSandboxAttr('att3')
    expect(preloadBuilder.sandboxAttrs).toEqual(['att1', 'att2', 'att3'])
  })

  it('can add allow attributes', () => {
    preloadBuilder.withAllowAttr('att1', 'att2')
    preloadBuilder.withAllowAttr('att3')
    expect(preloadBuilder.allowAttrs).toEqual(['att1', 'att2', 'att3'])
  })

  it('can add class names', () => {
    preloadBuilder.withClassName('class1', 'class2')
    preloadBuilder.withClassName('class3')
    expect(preloadBuilder.classNames).toEqual(['class1', 'class2', 'class3'])
  })

  it('can add a scroll monitor', () => {
    preloadBuilder.withScrollMonitor()
    expect(preloadBuilder.scrollMonitor).toBeTruthy()
  })

  it('can request dynamic heights', () => {
    preloadBuilder.withDynamicIFrameHeight()
    expect(preloadBuilder.dynamicIFrameHeight).toBeTruthy()
  })

  it('can request that dialogs be scrolled into view', () => {
    preloadBuilder.withDialogScroll()
    expect(preloadBuilder.dialogScroll).toBeTruthy()
  })

  it('identifies the appendTo element using a selector', () => {
    const el = document.createElement('div')
    el.id = 'the-element'
    document.body.append(el)
    preloadBuilder.appendTo('#the-element')
    expect(preloadBuilder.el).toBe(el)
    document.body.removeChild(el)
  })

  it('accepts an element as the appendTo element', () => {
    const el = document.createElement('div')
    document.body.append(el)
    preloadBuilder.appendTo(el)
    expect(preloadBuilder.el).toBe(el)
    document.body.removeChild(el)
  })

  it('stores on handlers correctly', () => {
    const pageHandler1 = jasmine.createSpy()
    const pageHandler2 = jasmine.createSpy()
    preloadBuilder.on('page:changed', pageHandler1)
    preloadBuilder.on('page:changed', pageHandler2)
    expect(preloadBuilder.handlers).toEqual({
      'page:changed': [pageHandler1, pageHandler2],
    })
  })

  it('builds', () => {
    const client = preloadBuilder.build()
    expect(client).toBeDefined()
    expect(client).not.toBe(preloadBuilder as any)
  })
})
