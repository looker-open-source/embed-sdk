/*

 MIT License

 Copyright (c) 2024 Looker Data Sciences, Inc.

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
import type { UrlParams } from './embed_builder'
import type { PageType } from './v2/types'

export function stringify(params: UrlParams) {
  const result: string[] = []
  for (const key in params) {
    const value = params[key]
    const valueArray = Array.isArray(value) ? value : [value]
    for (const singleValue of valueArray) {
      result.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(singleValue)}`
      )
    }
  }
  return result.join('&')
}

export function escapeFilterParam(param: string) {
  return param.replace(/,/g, '^,')
}

export const IS_URL = /^https?:\/\//

export function sanitizeHostUrl(hostUrl: string) {
  try {
    const protocol =
      hostUrl.startsWith('https://') || hostUrl.startsWith('http://')
        ? ''
        : 'https://'
    const url = new URL(`${protocol}${hostUrl}`)
    return `${url.hostname}${
      ['', '443', '80'].includes(url.port) ? '' : ':' + url.port
    }`
  } catch (error: any) {
    throw new Error(`Invalid host URL ${hostUrl}`)
  }
}

export function santizeEmbedUrl(embedUrl: string) {
  let urlString = embedUrl
  if (embedUrl.startsWith('https://') || embedUrl.startsWith('http://')) {
    try {
      const url = new URL(embedUrl)
      urlString = `${url.pathname}${url.search}${url.hash}`
    } catch (error: any) {
      throw new Error(`Invalid embed URL ${embedUrl}`)
    }
  }
  if (!urlString.startsWith('/embed')) {
    urlString = `/embed${urlString}`
  }
  return urlString
}

const validPageTypes = [
  'dashboards',
  'explore',
  'looks',
  'extensions',
  'preload',
  'query-visualization',
  'reports',
]

export function extractPageTypeFromUrl(url: string): PageType {
  const pageType = url.split('?')[0]?.split('/')[2]
  return validPageTypes.includes(pageType) ? (pageType as PageType) : 'unknown'
}
