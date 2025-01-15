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

export type PageType =
  | 'dashboards'
  | 'explore'
  | 'looks'
  | 'extensions'
  | 'query-visualization'
  | 'reports'
  | 'preload'
  | 'unknown'

export type LoadIdParams = {
  type: PageType
  id: string
  pushHistory?: boolean
  waitUntilLoaded?: boolean
}

export type LoadUrlParams = {
  url: string
  pushHistory?: boolean
  waitUntilLoaded?: boolean
}

export interface UrlParams {
  [key: string]: string | string[]
}

/**
 * Looker embedded connection
 */

export interface ILookerConnection {
  /**
   * Send a message to the embedded content.
   *
   * @param message String message identifier.
   * @param params Additional parameters to be sent to the client. After transmission ownership
   * of the parameters is transferred to the embedded Explore.
   */

  send(message: string, params?: any): void

  /**
   * Send a message to the embedded content and resolve with a response
   *
   * @param message String message identifier.
   * @param params Additional parameters to be sent to the client. After transmission ownership
   * of the parameters is transferred to the embedded Explore.
   */

  sendAndReceive(message: string, params?: any): Promise<any>

  /**
   * Returns a decimal representation of the major and minor version of the Looker instance
   * that has been embedded. The patch version is ignored.
   *
   * The value returned is -1 for Looker versions < 25.2.
   *
   * The value returned for 25.2.45 is 25.2
   */

  getLookerVersion(): number

  /**
   * @hidden
   */

  loadId(params: LoadIdParams): Promise<void>

  /**
   * Load Looker object using a URL. This does not recreate the IFRAME.
   *
   * Requires Looker 25.2 or greater. An error is thrown if unsupported
   * Looker version.
   */

  loadUrl(params: LoadUrlParams): Promise<void>

  /**
   * Load Looker dashboard. This does not recreate the IFRAME.
   *
   * For Looker 25.2 or greater it fires the new page:load event.
   * For Looker < 25.2 it fires the legacy dashboard:load event.
   */

  loadDashboard(id: string, pushHistory?: boolean): Promise<void>

  /**
   * Load Looker explore. This does not recreate the IFRAME.
   *
   * Requires Looker 25.2 or greater. An error is thrown if unsupported
   * Looker version.
   */

  loadExplore(id: string, pushHistory?: boolean): Promise<void>

  /**
   * Load Looker look. This does not recreate the IFRAME.
   *
   * Requires Looker 25.2 or greater. An error is thrown if unsupported
   * Looker version.
   */

  loadLook(id: string, pushHistory?: boolean): Promise<void>

  /**
   * Load Looker extension. This does not recreate the IFRAME.
   *
   * Requires Looker 25.2 or greater. An error is thrown if unsupported
   * Looker version.
   */

  loadExtension(id: string, pushHistory?: boolean): Promise<void>

  /**
   * Load Looker query visualization. This does not recreate the IFRAME.
   *
   * Requires Looker 25.2 or greater. An error is thrown if unsupported
   * Looker version.
   */

  loadQueryVisualization(id: string, pushHistory?: boolean): Promise<void>

  /**
   * Load Looker report. This does not recreate the IFRAME.
   *
   * Requires Looker 25.2 or greater. An error is thrown if unsupported
   * Looker version.
   */

  loadReport(id: string, pushHistory?: boolean): Promise<void>

  /**
   * Render the preload page. This does not recreate the IFRAME.
   *
   * Requires Looker 25.2 or greater. An error is thrown if unsupported
   * Looker version.
   */

  preload(): Promise<void>

  /**
   * Get the connection as a dashboard
   */

  asDashboardConnection(): ILookerEmbedDashboard

  /**
   * Get the connection as an explore
   */

  asExploreConnection(): ILookerEmbedExplore

  /**
   * Get the connection as an extension
   */

  asExtensionConnection(): ILookerEmbedExtension

  /**
   * Get the connection as an look
   */

  asLookConnection(): ILookerEmbedLook

  /**
   * Get the current page type
   */

  getPageType(): PageType

  /**
   * Returns true if the page is currently being edited
   */

  isEditing(): boolean

  /**
   * @deprecated use asXXXConnection().run() instead
   */

  run(): void

  /**
   * @deprecated use asDashboardConnection().stop() instead
   */

  stop(): void

  /**
   * @deprecated use asDashboardConnection().edit() instead
   */

  edit(): void

  /**
   * @deprecated use asXXXConnection().updateFilters(params) instead
   */

  updateFilters(params: LookerEmbedFilterParams): void

  /**
   * @deprecated use asDashboardConnection().setOptions(options) instead
   */

  setOptions(options: LookerDashboardOptions): void
  /**
   * @deprecated use asDashboardConnection().openScheduleDialog() instead
   */

  openScheduleDialog(): Promise<void>
}

/**
 * Client that communicates with an embedded Looker dashboard. Messages are documented
 * [here](https://docs.looker.com/r/sdk/events)
 */

export interface ILookerEmbedDashboard {
  /**
   * Convenience method for sending a run message to the embedded dashboard.
   */

  run(): void

  /**
   * Convenience method for sending a stop message to the embedded dashboard.
   */

  stop(): void

  /**
   * Convenience method for sending an edit message to the embedded dashboard.
   */

  edit(): void

  /**
   * Convenience method for updating the filters of the embedded dashboard.
   *
   * @param filters A set of filter parameters to update
   */

  updateFilters(params: LookerEmbedFilterParams): void

  /**
   * Convenience method for setting options on the embedded dashboard.
   *
   * @param options An options object to be applied
   */

  setOptions(options: LookerDashboardOptions): void

  /**
   * Convenience method for opening the dashboard schedule dialog.
   */

  openScheduleDialog(): Promise<void>
}

/**
 * Client that communicates with an embedded Looker explore. Messages are documented
 * [here](https://docs.looker.com/r/sdk/events)
 */

export interface ILookerEmbedExplore {
  /**
   * Convenience method for sending a run message to the embedded Explore.
   */

  run(): void

  /**
   * Convenience method for updating the filters of the embedded Explore.
   *
   * @param filters A set of filter parameters to update
   */

  updateFilters(params: LookerEmbedFilterParams): void
}

/**
 * Client that communicates with an embedded Looker Extension. Messages are documented
 * [here](https://docs.looker.com/r/sdk/events)
 */

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ILookerEmbedExtension {}

/**
 * Client that communicates with an embedded Looker Look. Messages are documented
 * [here](https://docs.looker.com/r/sdk/events)
 */

export interface ILookerEmbedLook {
  /**
   * Convenience method for sending a run message to the embedded Look.
   */

  run(): void

  /**
   * Convenience method for updating the filters of the embedded Look.
   *
   * @param filters A set of filter parameters to update
   */

  updateFilters(params: LookerEmbedFilterParams): void
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ILookerEmbedQueryVisualization {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ILookerEmbedReport {}

export interface IEmbedClient {
  connect(waitUntilLoaded?: boolean): Promise<ILookerConnection>
}

export interface IEmbedBuilder {
  /**
   * Value for the `frame-border` attribute of an embedded iframe
   */

  withFrameBorder(attr: string): IEmbedBuilder

  /**
   * Allows manual control of URL parameters for the embedded content
   *
   * @param params Additional URL parameters
   * created by ID.
   */

  withParams(params: UrlParams): IEmbedBuilder

  /**
   * Allows specifying initial filters to apply to the embedded content.
   *
   * @filters Filters to apply
   */

  withFilters(filters: LookerEmbedFilterParams, escape?: boolean): IEmbedBuilder

  /**
   * Allows specifying sandbox attributes for an embedded content iframe. Sandbox attributes
   * should include `allow-scripts` or embedded content will not execute.
   * @param attr one or more sandbox attributes for an embedded content iframe.
   */

  withSandboxAttr(...attr: string[]): IEmbedBuilder

  /**
   * Allows specifying allow attributes (for example fullscreen) for an embedded content iframe.
   * @param attr one or more allow attributes for an embedded content iframe.
   */

  withAllowAttr(...attr: string[]): IEmbedBuilder

  /**
   * Allows specifying classes for an embedded content
   * @param className one or more sandbox attributes for an embedded content.
   */

  withClassName(...className: string[]): IEmbedBuilder

  /**
   * Monitors scroll position and informs the embedded Looker IFRAME
   * of the current scroll position and the offset of the containing
   * IFRAME within the window. Looker uses this information to position
   * dialogs within the users viewport.
   *
   * @param monitor defaults to true
   *
   */
  withScrollMonitor(monitor?: boolean): IEmbedBuilder

  /**
   * Listens for page changed events from the embedded Looker IFRAME
   * and updates the height of the IFRAME.
   *
   * @param dynamicIFrameHeight defaults to true
   */
  withDynamicIFrameHeight(dynamicIFrameHeight?: boolean): IEmbedBuilder

  /**
   * Listens for covering dialogs being opened in the Looker IFRAME
   * and scrolls the top of dialog into view.
   *
   * @param dialogScroll defaults to true
   */
  withDialogScroll(dialogScroll?: boolean): IEmbedBuilder

  /**
   * Allows api host to be specified.
   *
   * @param apiHost
   */

  withApiHost(apiHost: string): IEmbedBuilder

  /**
   * Allows auth url to be specified
   *
   * @param authUrl URL to endpoint that can sign Looker SSO URLs
   */

  withAuthUrl(authUrl: string): IEmbedBuilder

  /**
   * Allows auth url to be specified
   *
   * @param auth
   */

  withAuth(auth: LookerAuthConfig): IEmbedBuilder

  /**
   * If private embed, appends allow_login_screen=true to the URL. This will
   * be ignored if the SDK is initialized with auth or cookieless.
   * willAllowLoginScreen does NOT work with Looker Core.
   */

  withAllowLoginScreen(): IEmbedBuilder

  /**
   * @deprecated dashboards legacy was was replaced by dashboards next.
   *             The `-next` suffix has no impact aside from the overhead
   *             of redirecting to /dashboards. Please remove.
   */

  withNext(_?: string): IEmbedBuilder

  /**
   *
   * Select an element to append the embedded content to, either a content selector or
   * the DOM element.
   *
   * @param el
   */

  appendTo(el: HTMLElement | string): IEmbedBuilder

  /**
   * Register an event handler.
   *
   * @typeparam K: A Looker embed event name
   * @param name: string Name of the event to respond to.
   * @param handler: Callback A callback method to be invoked when the message is received.
   */

  on<K extends keyof LookerEmbedEventMap>(
    name: K,
    handler: LookerEmbedEventMap[K]
  ): IEmbedBuilder

  /**
   * Constructs the embedded content, including creating the DOM element that contains the content.
   */

  build(): IEmbedClient
}

export interface ILookerEmbedSDK {
  /**
   * Initialize the Embed SDK.
   *
   * @param apiHost The address or base URL of the Looker host (example.looker.com:9999, https://example.looker.com:9999)
   *                This is required for verification of messages sent from the embedded content.
   * @param authUrl A server endpoint that will sign SSO embed URLs
   */

  init(apiHost: string, auth?: string | LookerAuthConfig): void

  /**
   * Initialize the Embed SDK to use a cookieless session.
   *
   * @param apiHost The address or base URL of the host (example.looker.com:9999, https://example.looker.com:9999)
   * @param acquireSession is either a string containing a server endpoint that will acquire the embed session OR
   * a RequestInfo object for a fetch call to the server endpoint that will acquire the embed session OR
   * a callback that will invoke the server endpoint that will acquire the embed session.
   * The server endpoint must ultimately call the Looker endpoint `acquire_embed_cookieless_session`.
   * @param generateTokens is either a string containing a server endpoint that will generate new tokens OR
   * a RequestInfo object for a fetch call to the server endpoint that will generate new tokens OR
   * a callback that will invoke the server endpoint that will generate new tokens.
   * The server endpoint should ultimately call the Looker endpoint `generate_tokens_for_cookieless_session`.
   */

  initCookieless(
    apiHost: string,
    acquireSession: string | CookielessRequestInit | CookielessCallback,
    generateTokens: string | CookielessRequestInit | GenerateTokensCallback
  ): void

  /**
   * Create an embed builder that preloads embedded Looker
   */

  preload(): IEmbedBuilder

  /**
   * Create a builder that loads an embedded URL. This can be used to preload Looker
   *
   * @param url A signed SSO embed URL or embed URL for an already authenticated Looker user
   */

  createWithUrl(url: string): IEmbedBuilder

  /**
   * Create a builder the initially loads a Looker dasboard
   *
   * @param url A signed SSO embed URL or embed URL for an already authenticated Looker user
   */

  createDashboardWithUrl(url: string): IEmbedBuilder

  /**
   * Create an EmbedBuilder for an embedded Looker dashboard.
   *
   * @param id The numeric ID of a Looker User Defined Dashboard, or LookML Dashboard ID
   */

  createDashboardWithId(id: string | number): IEmbedBuilder

  /**
   * Create an EmbedBuilder for an embedded Looker Explore.
   *
   * @param url A signed SSO embed URL or embed URL for an already authenticated Looker user
   */

  createExploreWithUrl(url: string): IEmbedBuilder

  /**
   * Create an EmbedBuilder for an embedded Looker Explore.
   *
   * @param id The ID of a Looker explore
   */

  createExploreWithId(id: string): IEmbedBuilder

  /**
   * Create an EmbedBuilder for an embedded Looker Look.
   *
   * @param url A signed SSO embed URL or embed URL for an already authenticated Looker user
   */

  createLookWithUrl(url: string): IEmbedBuilder

  /**
   * Create an EmbedBuilder for an embedded Looker look.
   *
   * @param id The ID of a Looker Look
   */

  createLookWithId(id: number): IEmbedBuilder

  /**
   * Create an EmbedBuilder for an embedded Looker extension.
   *
   * @param url A signed SSO embed URL or embed URL for an already authenticated Looker user
   */

  createExtensionWithUrl(url: string): IEmbedBuilder

  /**
   * Create an EmbedBuilder for an embedded Looker extension. Requires Looker 7.12
   *
   * @param id The ID of a Looker Look
   */

  createExtensionWithId(id: string): IEmbedBuilder

  /**
   * Create an EmbedBuilder for an embedded Looker query visualization.
   *
   * @param url A signed SSO embed URL or embed URL for an already authenticated Looker user
   */

  createQueryVisualizationWithUrl(url: string): IEmbedBuilder

  /**
   * Create an EmbedBuilder for an embedded Looker  query visualization.
   *
   * @param id The ID of a Looker query visualization
   */

  createQueryVisualizationWithId(id: string): IEmbedBuilder

  /**
   * Create an EmbedBuilder for an embedded Looker re[prt].
   *
   * @param url A signed SSO embed URL or embed URL for an already authenticated Looker user
   */

  createReportWithUrl(url: string): IEmbedBuilder

  /**
   * Create an EmbedBuilder for an embedded Looker report.
   *
   * @param id The ID of a Looker report
   */

  createReportWithId(id: string): IEmbedBuilder
}

/**
 * Convenience type to aid migration from Looker 1.8.x to 2.0.0.
 * In 1.8 this is a class that is treated as a type.
 *
 * @deprecated use ILookerConnection
 */

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface LookerEmbedDashboard extends ILookerConnection {}

/**
 * Convenience type to aid migration from Looker 1.8.x to 2.0.0.
 * In 1.8 this is a class that is treated as a type.
 *
 * @deprecated use ILookerConnection
 */

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface LookerEmbedExplore extends ILookerConnection {}

/**
 * Convenience type to aid migration from Looker 1.8.x to 2.0.0.
 * In 1.8 this is a class that is treated as a type.
 *
 * @deprecated use ILookerConnection
 */

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface LookerEmbedLook extends ILookerConnection {}

/**
 * Convenience type to aid migration from Looker 1.8.x to 2.0.0.
 * In 1.8 this is a class that is treated as a type.
 *
 * @deprecated use ILookerConnection
 */

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface LookerEmbedExtension extends ILookerConnection {}

/**
 * Convenience type to aid migration from Looker 1.8.x to 2.0.0.
 * In 1.8 this is a class that is treated as a type.
 *
 * @deprecated use ILookerConnection
 */

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface LookerEmbedBase extends ILookerConnection {}

/**
 * Convenience type to aid migration from Looker 1.8.x to 2.0.0.
 * In 1.8 this is a class that is treated as a type.
 *
 * @deprecated use IEmbedBuilder
 */

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EmbedBuilder extends IEmbedBuilder {}

/**
 * Convenience type to aid migration from Looker 1.8.x to 2.0.0.
 * In 1.8 this is a class that is treated as a type.
 *
 * @deprecated use IEmbedClient
 */

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EmbedClient extends IEmbedClient {}

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
 * Cookieless request callback function
 */

export type GenerateTokensCallback = (
  tokens: LookerEmbedCookielessTokenData
) => Promise<LookerEmbedCookielessSessionData>

/**
 * Cookieless token data
 */
export interface LookerEmbedCookielessTokenData {
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
 * Cookieless session data
 * Looker 23.0+
 */
export interface LookerEmbedCookielessSessionData
  extends LookerEmbedCookielessTokenData {
  /**
   * One time use token used to establish the cookieless embed session.
   */
  authentication_token?: string | null
  /**
   * Authentication token time to live in seconds.
   */
  authentication_token_ttl?: number | null
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
 * Drill modal download event
 */
export interface DrillModalDownloadEvent extends LookerEmbedEvent {
  dashboard: {
    id: string | number
    title: string
    url: string
    absoluteUrl: string
    dashboard_filters: LookerEmbedFilterParams
  }
  drillExploreUrl: string
  fileFormat: string
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
  lookerVersion?: string
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
 * Host scroll event data. Provides information to the Looker client
 * about the current scroll state. This allows the Looker client to
 * position dialogs within the users view port.
 *
 * Looker 23.6+
 */

export interface EnvHostScrollEvent extends LookerEmbedEvent {
  scrollY: number
  scrollX: number
  offsetTop: number
  offsetLeft: number
}

/**
 * Client dialog data. Provides information about Looker dialogs that
 * are being displayed. Information is only provided for those dialogs
 * that might require some viewport adjustment on the part of the
 * hosting application.
 *
 * Looker 23.6+
 */

export interface EnvClientDialogEvent extends LookerEmbedEvent {
  open: boolean
  placement: 'cover' | 'top' | 'center'
  dialogType: string
}

/**
 * Current Looker embed events as of version 6.20 (except where stated)
 */

export interface LookerEmbedEventMap {
  'dashboard:run:start': (
    this: ILookerConnection,
    event: DashboardEvent
  ) => void
  'dashboard:run:complete': (
    this: ILookerConnection,
    event: DashboardEvent
  ) => void
  'dashboard:filters:changed': (
    this: ILookerConnection,
    event: DashboardEvent
  ) => void
  /**
   * Dashboard editing started event.
   * Not available to legacy dashboards.
   * Looker 22.20+
   */
  'dashboard:edit:start': (
    this: ILookerConnection,
    event: DashboardEvent
  ) => void
  /**
   * Dashboard editing cancelled event.
   * Not available to legacy dashboards.
   * Looker 22.20+
   */
  'dashboard:edit:cancel': (
    this: ILookerConnection,
    event: DashboardEvent
  ) => void
  /**
   * Dashboard saved event. Fired when a dashboard
   * being edited is saved. Use in conjunction with
   * `dashboard:edit:start` and `dashboard:edit:save`.
   * Looker 21.6+
   */
  'dashboard:save:complete': (
    this: ILookerConnection,
    event: DashboardEvent
  ) => void
  /**
   * Dashboard deleted event
   * Looker 21.6+
   */
  'dashboard:delete:complete': (
    this: ILookerConnection,
    event: DashboardEvent
  ) => void
  'dashboard:tile:start': (
    this: ILookerConnection,
    event: DashboardTileEvent
  ) => void
  'dashboard:tile:complete': (
    this: ILookerConnection,
    event: DashboardTileEvent
  ) => void
  'dashboard:tile:download': (
    this: ILookerConnection,
    event: DashboardTileDownloadEvent
  ) => void
  'dashboard:tile:explore': (
    this: ILookerConnection,
    event: DashboardTileExploreEvent
  ) => CancellableEventResponse | undefined
  'dashboard:tile:view': (
    this: ILookerConnection,
    event: DashboardTileViewEvent
  ) => CancellableEventResponse | undefined

  'drillmenu:click': (
    this: ILookerConnection,
    event: DrillMenuEvent
  ) => CancellableEventResponse | undefined
  'drillmodal:download': (
    this: ILookerConnection,
    event: DrillModalDownloadEvent
  ) => void
  'drillmodal:explore': (
    this: ILookerConnection,
    event: DrillModalExploreEvent
  ) => CancellableEventResponse | undefined

  'explore:run:start': (this: ILookerConnection, event: ExploreEvent) => void
  'explore:run:complete': (this: ILookerConnection, event: ExploreEvent) => void
  'explore:ready': (this: ILookerConnection, event: ExploreEvent) => void
  'explore:state:changed': (
    this: ILookerConnection,
    event: ExploreEvent
  ) => void

  'look:run:start': (this: ILookerConnection, event: LookEvent) => void
  'look:run:complete': (this: ILookerConnection, event: LookEvent) => void
  /**
   * Look saved event
   * Looker 21.6+
   */
  'look:save:complete': (this: ILookerConnection, event: LookSaveEvent) => void
  /**
   * Look deleted event
   * Looker 21.6+
   */
  'look:delete:complete': (
    this: ILookerConnection,
    event: LookSaveEvent
  ) => void
  'look:ready': (this: ILookerConnection, event: LookEvent) => void
  'look:state:changed': (this: ILookerConnection, event: LookEvent) => void

  'page:changed': (this: ILookerConnection, event: PageChangedEvent) => void
  'page:properties:changed': (
    this: ILookerConnection,
    event: PagePropertiesChangedEvent
  ) => void
  /**
   * Cookieless embed session tokens request event
   * Looker 22.20+
   */
  'session:token:request': (
    this: ILookerConnection,
    event: SessionTokenRequest
  ) => void
  /**
   * Cookieless embed session status event
   * Looker 23.0+
   */
  'session:status': (this: ILookerConnection, event: SessionStatus) => void
  /**
   * Environment client dialog event
   * Looker 23.6+
   */
  'env:client:dialog': (
    this: ILookerConnection,
    event: EnvClientDialogEvent
  ) => void
  /**
   * Session expired event.
   * Looker 25.2+
   */
  'session:expired': (this: ILookerConnection) => void

  [key: string]: any
}
