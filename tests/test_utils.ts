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

import type { Callback } from '@looker/chatty'

export const waitFor = (
  callback: () => boolean,
  options?: { timeout?: number }
) =>
  new Promise<void>((resolve, reject) => {
    let count = 5
    setInterval(() => {
      count--
      if (callback()) {
        resolve()
      }
      if (count === 0) {
        reject(new Error('waitFor condition not met'))
      }
    }, options?.timeout)
  })

export class MockChattyHostConnection {
  send() {
    // noop
  }

  sendAndReceive(): Promise<void> {
    return Promise.resolve()
  }
}

export class MockChattyHost {
  _hostBuilder: MockHostBuilder
  _hostConnection?: MockChattyHostConnection
  iframe: HTMLIFrameElement = document.createElement('iframe')

  connect() {
    return new Promise((resolve) => {
      resolve(this._hostConnection)
    })
  }
}

export class MockHostBuilder {
  _chattyHost?: MockChattyHost
  _url?: string
  _source?: string
  _frameBorder?: string
  _handlers: any[] = []
  _targetOrigin?: string
  _el: HTMLElement
  _sandboxAttributes: string[] = []
  _allowAttributes: string[] = []

  frameBorder(border: string) {
    this._frameBorder = border
    return this
  }

  on(name: string, callback: Callback) {
    this._handlers.push([name, callback])
    return this
  }

  withTargetOrigin(targetOrigin: string) {
    this._targetOrigin = targetOrigin
    return this
  }

  withSandboxAttribute(...attr: string[]) {
    this._sandboxAttributes = this._sandboxAttributes.concat(attr)
    return this
  }

  withAllowAttribute(...attr: string[]) {
    this._allowAttributes = this._allowAttributes.concat(attr)
    return this
  }

  appendTo(el: HTMLElement) {
    this._el = el
    return this
  }

  build() {
    return this._chattyHost
  }

  countHandlersOfType(type) {
    return this._handlers.filter(([name]) => type === name).length
  }

  fireEventForHandler(name: string, event?: any) {
    this._handlers
      .filter(([handlerName]) => handlerName === name)
      .forEach(([_, callback]) => callback(event))
  }
}
