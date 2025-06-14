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
  LoadParams,
  LoadIdParams,
  LoadUrlArgs,
  LoadUrlParams,
  PageType,
  LookerDashboardOptions,
  LookerEmbedFilterParams,
  IConnectOptions,
  UrlParams,
} from './types'
import { ExploreConnection } from './ExploreConnection'
import { ExtensionConnection } from './ExtensionConnection'
import { LookConnection } from './LookConnection'
import { QueryVisualizationConnection } from './QueryVisualizationConnection'
import { ReportConnection } from './ReportConnection'
import type { EmbedClientEx } from './EmbedClientEx'
import { stringify } from './utils'
import e = require('express')

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

  getLookerMajorVersion() {
    return this._embedClient._lookerMajorVersion || -1
  }

  getLookerMinorVersion() {
    return this._embedClient._lookerMinorVersion || -1
  }

  async loadUrl({
    url,
    pushHistory = false,
    options,
  }: LoadUrlArgs | LoadUrlParams): Promise<any> {
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
    params = {},
  }: LoadIdParams): Promise<void> {
    const urlParams = stringify(params)
    const sep = urlParams ? '?' : ''
    return this.loadUrl({
      options,
      pushHistory,
      url: `/embed/${type}/${id}${sep}${urlParams}`,
    })
  }

  async loadDashboard(
    idOrParams: string | LoadParams,
    pushHistory?: boolean,
    options?: IConnectOptions
  ) {
    if (this._embedClient.isPageLoadEventSupported) {
      const loadIdParams: LoadIdParams =
        typeof idOrParams === 'string'
          ? {
              id: idOrParams,
              options,
              pushHistory,
              type: 'dashboards',
            }
          : { ...idOrParams, type: 'dashboards' }
      return this.loadId(loadIdParams)
    }
    switch (this._pageType) {
      case 'dashboards':
        return this.sendAndReceive('dashboard:load', {
          id: idOrParams,
          pushHistory: pushHistory || false,
        })
    }
  }

  async loadExplore(
    idOrParams: string | LoadParams,
    pushHistory?: boolean,
    options?: IConnectOptions
  ) {
    const loadIdParams: LoadIdParams =
      typeof idOrParams === 'string'
        ? {
            id: idOrParams,
            options,
            pushHistory,
            type: 'explore',
          }
        : { ...idOrParams, type: 'explore' }
    loadIdParams.id = loadIdParams.id.replace('::', '/') // Handle old format explore ids.
    return this.loadId(loadIdParams)
  }

  loadMergeQuery(
    idOrParams: string | LoadParams,
    pushHistoryArg?: boolean,
    optionsArg?: IConnectOptions
  ) {
    let id: string
    let pushHistory: boolean | undefined = undefined
    let options: IConnectOptions | undefined = undefined
    let qs = ''
    let sep = ''
    if (typeof idOrParams === 'string') {
      id = idOrParams
      pushHistory = pushHistoryArg
      options = optionsArg
    } else {
      id = idOrParams.id
      pushHistory = idOrParams.pushHistory
      options = idOrParams.options
      qs = stringify(idOrParams.params || {})
      sep = qs ? '&' : ''
    }
    return this.loadUrl({
      options,
      pushHistory,
      url: `/embed/merge?mid=${id}${sep}${qs}`,
    })
  }

  loadQuery(
    model: string,
    view: string,
    qid: string,
    pushHistory?: boolean,
    options?: IConnectOptions,
    urlParams?: UrlParams
  ) {
    let qs = stringify(urlParams || {})
    let sep = qs ? '&' : ''
    return this.loadUrl({
      options,
      pushHistory,
      url: `/embed/query/${model}/${view}?qid=${qid}${sep}${qs}`,
    })
  }

  async loadLook(
    idOrParams: string | LoadParams,
    pushHistory?: boolean,
    options?: IConnectOptions
  ) {
    const loadIdParams: LoadIdParams =
      typeof idOrParams === 'string'
        ? {
            id: idOrParams,
            options,
            pushHistory,
            type: 'looks',
          }
        : { ...idOrParams, type: 'looks' }
    return this.loadId(loadIdParams)
  }

  async loadExtension(
    idOrParams: string | LoadParams,
    pushHistory?: boolean,
    options?: IConnectOptions
  ) {
    const loadIdParams: LoadIdParams =
      typeof idOrParams === 'string'
        ? {
            id: idOrParams,
            options,
            pushHistory,
            type: 'extensions',
          }
        : { ...idOrParams, type: 'extensions' }
    return this.loadId(loadIdParams)
  }

  async loadQueryVisualization(
    idOrParams: string | LoadParams,
    pushHistory?: boolean,
    options?: IConnectOptions
  ) {
    const loadIdParams: LoadIdParams =
      typeof idOrParams === 'string'
        ? {
            id: idOrParams,
            options,
            pushHistory,
            type: 'query-visualization',
          }
        : { ...idOrParams, type: 'query-visualization' }
    return this.loadId(loadIdParams)
  }

  async loadReport(
    idOrParams: string | LoadParams,
    pushHistory?: boolean,
    options?: IConnectOptions
  ) {
    const loadIdParams: LoadIdParams =
      typeof idOrParams === 'string'
        ? {
            id: idOrParams,
            options,
            pushHistory,
            type: 'reporting',
          }
        : { ...idOrParams, type: 'reporting' }
    return this.loadId(loadIdParams)
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
