/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2019 Looker Data Sciences, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * Data structure for filters.
 */

export interface LookerEmbedFilterParams {
  [key: string]: string
}

/**
 * A generic Looker embed event
 */

export interface LookerEmbedEvent {
  type: string

  [key: string]: any
}

/**
 * A generic Looker event detail
 */

export interface EventDetail {
  [key: string]: any
}

/**
 * Detailed dashboard data returned by dashboard events
 */

export interface DashboardEventDetail extends EventDetail {
  id: string | number
  title: string
  dashboard_filters: LookerEmbedFilterParams
  absoluteUrl: string
  url: string
}

/**
 * Detailed tile data returned by dashboard events
 */

export interface DashboardTileEventDetail extends EventDetail {
  id: string | number
  title: string
  listen: string
}

/**
 * Dashboard event
 */

export interface DashboardEvent extends LookerEmbedEvent {
  dashboard: DashboardEventDetail
}

/**
 * Dashboard tile event
 */

export interface DashboardTileEvent {
  dashboard: DashboardEventDetail
  tile: DashboardTileEventDetail
}

/**
 * Dashboard tile download event
 */

export interface DashboardTileDownloadEvent extends DashboardTileEvent {
  fileFormat: string
}

/**
 * Dashboard tile Explore from Here event
 *
 * Requires Looker 6.20
 */

export interface DashboardTileExploreEvent extends DashboardTileEvent {
  label: string
  url: string
}

/**
 * Dashboard tile View Original Look event
 *
 * Requires Looker 6.20
 */

export interface DashboardTileViewEvent extends DashboardTileEvent {
  label: string
  url: string
}

/**
 * Drill menu addFilterJson data
 */

export interface AddFilterJson {
  rendered: string
  field: string
  add: string
}

/**
 * Drill menu event
 */

export interface DrillMenuEvent extends LookerEmbedEvent {
  label: string
  link_type: string
  url: string
  modal: boolean
  context: string
  addFilterJson: AddFilterJson
}

/**
 * Drill Modal Explore from Here event
 *
 * Requires Looker 6.20
 */
export interface DrillModalExploreEvent extends LookerEmbedEvent {
  label: string
  url: string
}

/**
 * Look page event details
 */

export interface LookEventDetail extends EventDetail {
  absoluteUrl: string
  url: string
}

/**
 * Look page event
 */
export interface LookEvent extends LookerEmbedEvent {
  look: LookEventDetail
}

/**
 * Explore page event details
 */

export interface ExploreEventDetail extends EventDetail {
  absoluteUrl: string
  url: string
}

/**
 * Explore page event.
 */

export interface ExploreEvent extends LookerEmbedEvent {
  explore: ExploreEventDetail
}

/**
 * Page changed event details
 */

export interface PageChangedEventDetail extends EventDetail {
  type: string
  url: string
  absoluteUrl: string
}

/**
 * Page changed event. These are generated when navigating from one page to another.
 */
export interface PageChangedEvent extends LookerEmbedEvent {
  page: PageChangedEventDetail
}

/**
 * Page properties changed event. These are generated when a significant property changes on a page,
 * like when a dashboard's height changes.
 */

export interface PagePropertiesChangedEvent extends LookerEmbedEvent {
  height?: number
}

/**
 * Cancellable event response
 */

export interface CancellableEventResponse {
  cancel: boolean
}

/**
 * Current Looker embed events as of version 6.20
 */

export interface LookerEmbedEventMap {
  'dashboard:run:start': (event: DashboardEvent) => void
  'dashboard:run:complete': (event: DashboardEvent) => void
  'dashboard:filters:changed': (event: DashboardEvent) => void
  'dashboard:tile:start': (event: DashboardTileEvent) => void
  'dashboard:tile:complete': (event: DashboardTileEvent) => void
  'dashboard:tile:download': (event: DashboardTileDownloadEvent) => void
  'dashboard:tile:explore': (event: DashboardTileExploreEvent) => CancellableEventResponse | undefined
  'dashboard:tile:view': (event: DashboardTileViewEvent) => CancellableEventResponse | undefined

  'drillmenu:click': (event: DrillMenuEvent) => CancellableEventResponse | undefined
  'drillmodal:explore': (event: DrillModalExploreEvent) => CancellableEventResponse | undefined

  'explore:run:start': (event: ExploreEvent) => void
  'explore:run:complete': (event: ExploreEvent) => void

  'look:run:start': (event: LookEvent) => void
  'look:run:complete': (event: LookEvent) => void

  'page:changed': (event: PageChangedEvent) => void
  'page:properties:changed': (event: PagePropertiesChangedEvent) => void

  [key: string]: any
}
