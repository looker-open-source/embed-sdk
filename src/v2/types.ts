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
import type { UrlParams } from 'src/embed_builder'
import type {
  CookielessCallback,
  GenerateTokensCallback,
  CookielessRequestInit,
  LookerAuthConfig,
  LookerDashboardOptions,
  LookerEmbedEventMap,
  LookerEmbedFilterParams,
} from 'src/types'

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
