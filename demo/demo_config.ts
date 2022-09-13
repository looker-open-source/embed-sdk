/*

 MIT License

 Copyright (c) 2022 Looker Data Sciences, Inc.

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

export const lookerHost = 'self-signed.looker.com:9999'
// export const lookerHost = 'mycompany.looker.com'

// A dashboard that the user can see. Set to 0 to disable dashboard demo.
export const dashboardId = 21

// A Look that the user can see. Set to 0 to disable look demo.
export const lookId = 0

// An Explore that the user can see. Set to '' to disable explore demo.
// export const exploreId = 'thelook::products'
export const exploreId = ''

// An Extension that the user can see. Set to '' to disable extension demo.
// export const extensionId = 'extension::my-great-extension'
// Requires Looker 7.12 and extensions framework.
export const extensionId = ''

// Demo new cookieless embed (new cookieless embed is not backward compatible)
export const cookielessEmbedV2 = true
