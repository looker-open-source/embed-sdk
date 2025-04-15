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
  ILookerEmbedQueryVisualization,
  ILookerEmbedReport,
  LoadIdParams,
  LoadUrlParams,
  PageType,
  LookerDashboardOptions,
  LookerEmbedFilterParams,
  IConnectOptions,
} from './types'
import { ExploreConnection } from './ExploreConnection'
import { ExtensionConnection } from './ExtensionConnection'
import { LookConnection } from './LookConnection'
import { QueryVisualizationConnection } from './QueryVisualizationConnection'
import { ReportConnection } from './ReportConnection'
import type { EmbedClientEx } from './EmbedClientEx'

export class EmbedConnection implements ILookerConnection {
  _pageType: PageType = 'unknown'
  _isEditing: boolean = false
  _currentPathname: string = ''

  constructor(
    private _host: ChattyHostConnection,
    private _embedClient: EmbedClientEx
  ) {}

  send(message: string, params?: any) {
    this._host.send(message, params)
  }

  async sendAndReceive(message: string, params?: any) {
    return this._host.sendAndReceive(message, params)
  }

  getLookerVersion() {
    if (this._embedClient._lookerVersion === undefined) {
      return -1
    }
    return this._embedClient._lookerVersion
  }

  async loadUrl({
    url,
    pushHistory = false,
    options,
  }: LoadUrlParams): Promise<any> {
    if (!this._embedClient.isPageLoadEventSupported) {
      return Promise.reject(
        new Error(
          "The 'page:load' action requires Looker version 25.2.0 or greater"
        )
      )
    }
    switch (this._pageType) {
      case 'dashboards':
        this.asDashboardConnection().stop()
        break
    }
    const pageChangePromise = options?.waitUntilLoaded
      ? new Promise<EmbedConnection>((resolve) => {
          this._embedClient._pageChangeResolver = resolve
        })
      : undefined

    const pageLoadPromise = this.sendAndReceive('page:load', {
      pushHistory,
      url: this._embedClient.appendRequiredParameters(url),
    })
    return options?.waitUntilLoaded ? pageChangePromise : pageLoadPromise
  }

  async loadId({
    type,
    id,
    pushHistory,
    options,
  }: LoadIdParams): Promise<void> {
    return this.loadUrl({
      options,
      pushHistory,
      url: `/embed/${type}/${id}`,
    })
  }

  async loadDashboard(
    id: string,
    pushHistory?: boolean,
    options?: IConnectOptions
  ) {
    if (this._embedClient.isPageLoadEventSupported) {
      return this.loadId({
        id,
        options,
        pushHistory,
        type: 'dashboards',
      })
    }
    switch (this._pageType) {
      case 'dashboards':
        return this.sendAndReceive('dashboard:load', {
          id,
          pushHistory: pushHistory || false,
        })
    }
  }

  async loadExplore(
    id: string,
    pushHistory?: boolean,
    options?: IConnectOptions
  ) {
    id = id.replace('::', '/') // Handle old format explore ids.
    return this.loadId({ id, options, pushHistory, type: 'explore' })
  }

  loadMergeQuery(id: string, pushHistory?: boolean, options?: IConnectOptions) {
    return this.loadUrl({
      options,
      pushHistory,
      url: `/embed/merge?mid=${id}`,
    })
  }

  loadQuery(
    model: string,
    view: string,
    qid: string,
    pushHistory?: boolean,
    options?: IConnectOptions
  ) {
    return this.loadUrl({
      options,
      pushHistory,
      url: `/embed/query/${model}/${view}?qid=${qid}`,
    })
  }

  async loadLook(id: string, pushHistory?: boolean, options?: IConnectOptions) {
    return this.loadId({
      id,
      options,
      pushHistory,
      type: 'looks',
    })
  }

  async loadExtension(
    id: string,
    pushHistory?: boolean,
    options?: IConnectOptions
  ) {
    return this.loadId({ id, options, pushHistory, type: 'extensions' })
  }

  async loadQueryVisualization(
    id: string,
    pushHistory?: boolean,
    options?: IConnectOptions
  ) {
    return this.loadId({
      id,
      options,
      pushHistory,
      type: 'query-visualization',
    })
  }

  async loadReport(
    id: string,
    pushHistory?: boolean,
    options?: IConnectOptions
  ) {
    return this.loadId({
      id,
      options,
      pushHistory,
      type: 'reporting',
    })
  }

  async preload(pushHistory?: boolean, options?: IConnectOptions) {
    return this.loadUrl({ options, pushHistory, url: '/embed/preload' })
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

  asQueryVisualizationConnection(): ILookerEmbedQueryVisualization {
    return new QueryVisualizationConnection(this)
  }

  asReportConnection(): ILookerEmbedReport {
    return new ReportConnection(this)
  }

  getPageType() {
    return this._pageType
  }

  isEditing() {
    return this._isEditing
  }

  hasSessionExpired() {
    return this._embedClient._hasSessionExpired
  }

  // deprecated methods to support migration from 1.18.x to 2.0.0

  /**
   * @deprecated use asXXXConnection().run() instead
   */

  run() {
    switch (this._pageType) {
      case 'dashboards':
        this.asDashboardConnection().run()
        break
      case 'looks':
        this.asLookConnection().run()
        break
      case 'explore':
        this.asLookConnection().run()
        break
    }
  }

  /**
   * @deprecated use asDashboardConnection().stop() instead
   */

  stop() {
    switch (this._pageType) {
      case 'dashboards':
        this.asDashboardConnection().stop()
        break
    }
  }

  /**
   * @deprecated use asDashboardConnection().edit() instead
   */

  edit() {
    switch (this._pageType) {
      case 'dashboards':
        this.asDashboardConnection().edit()
        break
    }
  }

  /**
   * @deprecated use asXXXConnection().updateFilters(params) instead
   */

  updateFilters(params: LookerEmbedFilterParams) {
    switch (this._pageType) {
      case 'dashboards':
        this.asDashboardConnection().updateFilters(params)
        break
      case 'looks':
        this.asLookConnection().updateFilters(params)
        break
      case 'explore':
        this.asLookConnection().updateFilters(params)
        break
    }
  }

  /**
   * @deprecated use asDashboardConnection().setOptions(options) instead
   */

  setOptions(options: LookerDashboardOptions) {
    switch (this._pageType) {
      case 'dashboards':
        this.asDashboardConnection().setOptions(options)
        break
    }
  }

  /**
   * @deprecated use asDashboardConnection().openScheduleDialog() instead
   */

  async openScheduleDialog(): Promise<void> {
    switch (this._pageType) {
      case 'dashboards':
        return this.asDashboardConnection().openScheduleDialog()
    }
  }
}
