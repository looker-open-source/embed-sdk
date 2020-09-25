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

import { EmbedBuilder } from './embed_builder'
import { LookerEmbedDashboard } from './dashboard_client'
import { LookerEmbedExplore } from './explore_client'
import { LookerEmbedExtension } from './extension_client'
import { LookerEmbedLook } from './look_client'

export type { LookerEmbedDashboard } from './dashboard_client'
export type { LookerEmbedExplore } from './explore_client'
export type { LookerEmbedExtension } from './extension_client'
export type { LookerEmbedLook } from './look_client'
export * from './types'

export class LookerEmbedSDK {

  /**
   * Initialize the Embed SDK.
   *
   * @param apiHost The address or base URL of the Looker host (example.looker.com:9999, https://example.looker.com:9999)
   *                This is required for verification of messages sent from the embedded content.
   * @param authUrl A server endpoint that will sign SSO embed URLs
   */

  static init (apiHost: string, authUrl?: string) {
    this.apiHost = apiHost
    this.authUrl = authUrl
  }

  /**
   * Create an EmbedBuilder for an embedded Looker dashboard.
   *
   * @param url A signed SSO embed URL or embed URL for an already authenticated Looker user
   */

  static createDashboardWithUrl (url: string) {
    return new EmbedBuilder<LookerEmbedDashboard>(this, 'dashboard', '/embed/dashboards', LookerEmbedDashboard).withUrl(url)
  }

  /**
   * Create an EmbedBuilder for an embedded Looker dashboard.
   *
   * @param id The numeric ID of a Looker User Defined Dashboard, or LookML Dashboard ID
   */

  static createDashboardWithId (id: string | number) {
    return new EmbedBuilder<LookerEmbedDashboard>(this, 'dashboard', '/embed/dashboards', LookerEmbedDashboard).withId(id)
  }

  /**
   * Create an EmbedBuilder for an embedded Looker Explore.
   *
   * @param url A signed SSO embed URL or embed URL for an already authenticated Looker user
   */

  static createExploreWithUrl (url: string) {
    return new EmbedBuilder<LookerEmbedExplore>(this, 'explore', '/embed/explore', LookerEmbedExplore).withUrl(url)
  }

  /**
   * Create an EmbedBuilder for an embedded Looker Explore.
   *
   * @param id The ID of a Looker explore
   */

  static createExploreWithId (id: string) {
    id = id.replace('::', '/') // Handle old format explore ids.
    return new EmbedBuilder<LookerEmbedExplore>(this, 'explore', '/embed/explore', LookerEmbedExplore).withId(id)
  }

  /**
   * Create an EmbedBuilder for an embedded Looker Look.
   *
   * @param url A signed SSO embed URL or embed URL for an already authenticated Looker user
   */

  static createLookWithUrl (url: string) {
    return new EmbedBuilder<LookerEmbedLook>(this, 'look', '/embed/looks', LookerEmbedLook).withUrl(url)
  }

  /**
   * Create an EmbedBuilder for an embedded Looker dashboard.
   *
   * @param id The ID of a Looker Look
   */

  static createLookWithId (id: number) {
    return new EmbedBuilder<LookerEmbedLook>(this, 'look', '/embed/looks', LookerEmbedLook).withId(id)
  }

  /**
   * Create an EmbedBuilder for an embedded Looker extension.
   *
   * @param url A signed SSO embed URL or embed URL for an already authenticated Looker user
   */

  static createExtensionWithUrl (url: string) {
    return new EmbedBuilder<LookerEmbedExtension>(this, 'extension', '/embed/extensions', LookerEmbedExtension).withUrl(url)
  }

  /**
   * Create an EmbedBuilder for an embedded Looker extension. Requires Looker 7.12
   *
   * @param id The ID of a Looker Look
   */

  static createExtensionWithId (id: string) {
    return new EmbedBuilder<LookerEmbedExtension>(this, 'extension', '/embed/extensions', LookerEmbedExtension).withId(id)
  }

  /**
   * @hidden
   */

  static apiHost: string

  /**
   * @hidden
   */

  static authUrl?: string
}
