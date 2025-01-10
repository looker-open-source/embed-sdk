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

import type { ChattyHostConnection } from '@looker/chatty'
import { DashboardConnection } from './DashboardConnection'
import type {
  ILookerConnection,
  ILookerEmbedDashboard,
  ILookerEmbedExplore,
  ILookerEmbedExtension,
  ILookerEmbedLook,
  LoadIdParams,
  LoadUrlParams,
  PageType,
} from './types'
import { ExploreConnection } from './ExploreConnection'
import { ExtensionConnection } from './ExtensionConnection'
import { LookConnection } from './LookConnection'
import type { EmbedClientEx } from './EmbedClientEx'

export class EmbedConnection implements ILookerConnection {
  _pageType: PageType = 'unknown'

  constructor(
    private _host: ChattyHostConnection,
    private _embedClient: EmbedClientEx
  ) {}

  /**
   * Send a message to the embedded content.
   *
   * @param message String message identifier.
   * @param params Additional parameters to be sent to the client. After transmission ownership
   * of the parameters is transferred to the embedded Explore.
   */

  send(message: string, params?: any) {
    this._host.send(message, params)
  }

  /**
   * Send a message to the embedded content and resolve with a response
   *
   * @param message String message identifier.
   * @param params Additional parameters to be sent to the client. After transmission ownership
   * of the parameters is transferred to the embedded Explore.
   */

  async sendAndReceive(message: string, params?: any) {
    return this._host.sendAndReceive(message, params)
  }

  async loadUrl({
    url,
    pushHistory = false,
    waitUntilLoaded = true,
  }: LoadUrlParams): Promise<void> {
    const pageChangePromise = waitUntilLoaded
      ? new Promise<EmbedConnection>((resolve) => {
          this._embedClient._pageChangeResolver = resolve
        })
      : undefined

    const pageLoadPromise = this.sendAndReceive('page:load', {
      pushHistory,
      url: this._embedClient.appendRequiredParameters(url),
    })
    return waitUntilLoaded ? pageChangePromise : pageLoadPromise
  }

  async loadId({
    type,
    id,
    pushHistory,
    waitUntilLoaded,
  }: LoadIdParams): Promise<void> {
    return this.loadUrl({
      pushHistory,
      url: `/embed/${type}/${id}`,
      waitUntilLoaded,
    })
  }

  async loadDashboard(
    id: string,
    pushHistory?: boolean,
    waitUntilLoaded?: boolean
  ) {
    return this.loadId({ id, pushHistory, type: 'dashboards', waitUntilLoaded })
  }

  async loadExplore(
    id: string,
    pushHistory?: boolean,
    waitUntilLoaded?: boolean
  ) {
    id = id.replace('::', '/') // Handle old format explore ids.
    return this.loadId({ id, pushHistory, type: 'explore', waitUntilLoaded })
  }

  async loadLook(id: string, pushHistory?: boolean, waitUntilLoaded?: boolean) {
    return this.loadId({
      id,
      pushHistory,
      type: 'looks',
      waitUntilLoaded,
    })
  }

  async loadExtension(
    id: string,
    pushHistory?: boolean,
    waitUntilLoaded?: boolean
  ) {
    return this.loadId({ id, pushHistory, type: 'extensions', waitUntilLoaded })
  }

  async preload(pushHistory?: boolean, waitUntilLoaded?: boolean) {
    return this.loadUrl({ pushHistory, url: '/embed/preload', waitUntilLoaded })
  }

  asDashboardConnection(): ILookerEmbedDashboard {
    return new DashboardConnection(this)
  }

  asExploreConnection(): ILookerEmbedExplore {
    return new ExploreConnection(this)
  }

  asExtensionConnection(): ILookerEmbedExtension {
    return new ExtensionConnection(this)
  }

  asLookConnection(): ILookerEmbedLook {
    return new LookConnection(this)
  }

  getPageType() {
    return this._pageType
  }
}
