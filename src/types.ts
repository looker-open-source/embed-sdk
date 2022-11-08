/*

 MIT License

 Copyright (c) 2019 Looker Data Sciences, Inc.

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

import type { LookerEmbedBase } from './embed_base'
import type { LookerEmbedDashboard } from './dashboard_client'
import type { LookerEmbedLook } from './look_client'

/**
 * Auth server configuration
 */
export interface LookerAuthConfig {
  url: string
  headers?: Array<{ name: string; value: string }>
  params?: Array<{ name: string; value: string }>
  withCredentials?: boolean
}

/**
 * Cookieless request init
 * Looker 22.20+
 */
export interface CookielessRequestInit extends RequestInit {
  url: string
}

/**
 * Cookieless request callback function
 * Looker 22.20+
 */

export type CookielessCallback = () => Promise<LookerEmbedCookielessSessionData>

/**
 * Cookieless session data
 * Looker 23.0+
 */
export interface LookerEmbedCookielessSessionData {
  /**
   * One time use token used to establish the cookieless embed session.
   */
  authentication_token?: string | null
  /**
   * Authentication token time to live in seconds.
   */
  authentication_token_ttl?: number | null
  /**
   * Token used to load and navigate between pages in the embedded session. This token is appended to the embed iframe url.
   */
  navigation_token?: string | null
  /**
   * Navigation token time to live in seconds.
   */
  navigation_token_ttl?: number | null
  /**
   * Token to used to call Looker APIs. The host application MUST send the api token to the embedded Looker application. Do not expose the token in the dom.
   */
  api_token?: string | null
  /**
   * api_token time to live in seconds.
   */
  api_token_ttl?: number | null
  /**
   * Session time to live in seconds.
   */
  session_reference_token_ttl?: number | null
}

/**
 * Data structure for filters.
 */

export interface LookerEmbedFilterParams {
  [key: string]: string
}

/**
 * Dashboard Layout
 *
 * Contains details of dashboard layout.
 */

export interface DashboardLayout {
  id: string
  dashboard_id: string
  type: 'newspaper'
  active: boolean
  column_width: number
  width: number | null
  deleted: boolean
  dashboard_layout_components: DashboardLayoutComponent[]
}

/**
 * Dashboard Layout Component
 *
 * Contains details of individual dashboard element layout.
 */

export interface DashboardLayoutComponent {
  id: string
  dashboard_layout_id: string
  dashboard_element_id: string
  row: number
  column: number
  width: number
  height: number
  deleted: boolean
}

/**
 * Visualization Config interface
 */

export interface VisConfig {
  type: string
  [key: string]: any
}

/**
 * Element Options interface
 */

export interface ElementOptionItems {
  title?: string | null
  title_hidden?: boolean
  vis_config?: VisConfig | null
}

/**
 * Element to element options mapping interface
 */
export interface ElementOptions {
  [id: string]: ElementOptionItems
}

/**
 * Options interface
 */

export interface LookerDashboardOptions {
  elements?: ElementOptions
  layouts?: DashboardLayout[]
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
 * Cookieless embed session token request
 * Looker 22.20+
 */

export type SessionTokenRequest = EventDetail

/**
 * Cookieless session status event
 * Looker 23.0+
 */

export interface SessionStatus extends EventDetail {
  /**
   * Session time to live in seconds
   */
  session_ttl: number
  /**
   * Session expired when true
   */
  expired: boolean
  /**
   * Session interrupted when true. This means new
   * tokens could not be retrieved in a timely manner.
   * Can happen if server is temporarily unavailable
   * for some reason
   */
  interrupted: boolean
  /**
   * Interrupted session can be recovered. When false
   * session cannot continue. This is most likely
   * a problem with the embedding application.
   */
  recoverable?: boolean
}

/**
 * Detailed dashboard data returned by dashboard events
 */

export interface DashboardEventDetail extends EventDetail {
  id: string | number
  title: string
  canEdit: boolean
  dashboard_filters: LookerEmbedFilterParams
  absoluteUrl: string
  url: string
  options: LookerDashboardOptions
}

/**
 * Detailed tile data returned by dashboard events
 */

export interface DashboardTileEventDetail extends EventDetail {
  id: string | number
  title: string
  listen: Record<string, string | null>
}

/**
 * Dashboard tile status
 *
 * Available on Dashboards Next
 *
 * Requires Looker 21.14
 */

export interface TileStatus {
  tileId: string
  status: 'error' | 'complete'
  errors?: Array<QueryError>
}

/**
 * Dashboard event
 */

export interface DashboardEvent extends LookerEmbedEvent {
  dashboard: DashboardEventDetail
  /// Available on Dashboards Next
  status?: 'complete' | 'error' | 'stopped'
  /// Available on Dashboards Next
  /// Requires Looker 21.14
  tileStatuses: Array<TileStatus>
}

/**
 * Query error detail
 *
 * Requires Looker 21.14
 */

export interface QueryError {
  message: string | null
  message_details: string | null
  params: string | null
  error_pos: string | null
  level: string
  fatal?: boolean
  sql_error_loc: {
    [key: string]: any
  }
}

/**
 * Dashboard tile event
 */

export interface DashboardTileEvent {
  dashboard: DashboardEventDetail
  tile: DashboardTileEventDetail
  /// Available on Dashboards Next
  status?: 'complete' | 'error'
  /// Available on Dashboards Next
  truncated?: boolean
  /// Available on Dashboards Next
  /// Requires Looker 21.14
  errors?: Array<QueryError>
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
 * Look save event details
 * Looker version 21.6+
 */

export interface LookSaveEventDetail extends LookEventDetail {
  /**
   * Folder Look is associated with
   * Looker version 21.8+
   */
  spaceId: number
}

/**
 * Look save event
 * Looker version 21.6+
 */
export interface LookSaveEvent extends LookerEmbedEvent {
  look: LookSaveEventDetail
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
 * Current Looker embed events as of version 6.20 (except where stated)
 */

export interface LookerEmbedEventMap {
  'dashboard:run:start': (
    this: LookerEmbedDashboard,
    event: DashboardEvent
  ) => void
  'dashboard:run:complete': (
    this: LookerEmbedDashboard,
    event: DashboardEvent
  ) => void
  'dashboard:filters:changed': (
    this: LookerEmbedDashboard,
    event: DashboardEvent
  ) => void
  /**
   * Dashboard editing started event.
   * Not available to legacy dashboards.
   * Looker 22.20+
   */
  'dashboard:edit:start': (
    this: LookerEmbedDashboard,
    event: DashboardEvent
  ) => void
  /**
   * Dashboard editing cancelled event.
   * Not available to legacy dashboards.
   * Looker 22.20+
   */
  'dashboard:edit:cancel': (
    this: LookerEmbedDashboard,
    event: DashboardEvent
  ) => void
  /**
   * Dashboard saved event. Fired when a dashboard
   * being edited is saved. Use in conjunction with
   * `dashboard:edit:start` and `dashboard:edit:save`.
   * Looker 21.6+
   */
  'dashboard:save:complete': (
    this: LookerEmbedDashboard,
    event: DashboardEvent
  ) => void
  /**
   * Dashboard deleted event
   * Looker 21.6+
   */
  'dashboard:delete:complete': (
    this: LookerEmbedDashboard,
    event: DashboardEvent
  ) => void
  'dashboard:tile:start': (
    this: LookerEmbedDashboard,
    event: DashboardTileEvent
  ) => void
  'dashboard:tile:complete': (
    this: LookerEmbedDashboard,
    event: DashboardTileEvent
  ) => void
  'dashboard:tile:download': (
    this: LookerEmbedDashboard,
    event: DashboardTileDownloadEvent
  ) => void
  'dashboard:tile:explore': (
    this: LookerEmbedDashboard,
    event: DashboardTileExploreEvent
  ) => CancellableEventResponse | undefined
  'dashboard:tile:view': (
    this: LookerEmbedDashboard,
    event: DashboardTileViewEvent
  ) => CancellableEventResponse | undefined

  'drillmenu:click': (
    this: LookerEmbedBase,
    event: DrillMenuEvent
  ) => CancellableEventResponse | undefined
  'drillmodal:explore': (
    this: LookerEmbedBase,
    event: DrillModalExploreEvent
  ) => CancellableEventResponse | undefined

  'explore:run:start': (this: LookerEmbedLook, event: ExploreEvent) => void
  'explore:run:complete': (this: LookerEmbedLook, event: ExploreEvent) => void
  'explore:ready': (this: LookerEmbedLook, event: ExploreEvent) => void
  'explore:state:changed': (this: LookerEmbedLook, event: ExploreEvent) => void

  'look:run:start': (this: LookerEmbedLook, event: LookEvent) => void
  'look:run:complete': (this: LookerEmbedLook, event: LookEvent) => void
  /**
   * Look saved event
   * Looker 21.6+
   */
  'look:save:complete': (this: LookerEmbedLook, event: LookSaveEvent) => void
  /**
   * Look deleted event
   * Looker 21.6+
   */
  'look:delete:complete': (this: LookerEmbedLook, event: LookSaveEvent) => void
  'look:ready': (this: LookerEmbedLook, event: LookEvent) => void
  'look:state:changed': (this: LookerEmbedLook, event: LookEvent) => void

  'page:changed': (this: LookerEmbedBase, event: PageChangedEvent) => void
  'page:properties:changed': (
    this: LookerEmbedBase,
    event: PagePropertiesChangedEvent
  ) => void
  /**
   * Cookieless embed session tokens request event
   * Looker 22.20+
   */
  'session:token:request': (
    this: LookerEmbedBase,
    event: SessionTokenRequest
  ) => void
  /**
   * Cookieless embed session status event
   * Looker 23.0+
   */
  'session:status': (this: LookerEmbedBase, event: SessionStatus) => void

  [key: string]: any
}
