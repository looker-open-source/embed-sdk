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

import { LookerEmbedSDK } from '../../src'
import {
  getSDKFactory,
  LookerEmbedSDKFactory,
} from '../../src/v2/LookerEmbedSDKFactory'
import type { ILookerEmbedSDK } from '../../src/v2/types'

describe('LookerEmbedSDKFactory', () => {
  it('returns the same factory', () => {
    const factory = getSDKFactory()
    expect(factory === getSDKFactory()).toBeTruthy()
  })

  it('allows an SDK to be injected', () => {
    const sdk = {} as ILookerEmbedSDK
    const factory = new LookerEmbedSDKFactory(sdk)
    expect(sdk === factory.getSDK()).toBeTruthy()
  })

  it('returns an instance of the new SDK from the original SDK', () => {
    const sdk = LookerEmbedSDK.getSDK()
    expect(sdk).toBeDefined()
    expect(LookerEmbedSDK.getSDK()).toBe(sdk)
  })
})
