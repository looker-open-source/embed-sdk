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
import { LookerEmbedLook } from './look_client'

export { LookerEmbedDashboard } from './dashboard_client'
export { LookerEmbedExplore } from './explore_client'
export { LookerEmbedLook } from './look_client'

export class LookerEmbedSDK {

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
    return new EmbedBuilder<LookerEmbedDashboard>(this, 'dashboard', LookerEmbedDashboard).withUrl(url)
  }

  /**
   * Create an EmbedBuilder for an embedded Looker dashboard.
   *
   * @param id The numeric ID of a Looker User Defined Dashboard, or LookML Dashboard ID
   */

  static createDashboardWithId (id: string | number) {
    return new EmbedBuilder<LookerEmbedDashboard>(this, 'dashboard', LookerEmbedDashboard).withId(id)
  }

  /**
   * Create an EmbedBuilder for an embedded Looker Explore.
   *
   * @param url A signed SSO embed URL or embed URL for an already authenticated Looker user
   */

  static createExploreWithUrl (url: string) {
    return new EmbedBuilder<LookerEmbedExplore>(this, 'explore', LookerEmbedExplore).withUrl(url)
  }

  /**
   * Create an EmbedBuilder for an embedded Looker Explore.
   *
   * @param id The ID of a Looker explore
   */

  static createExploreWithId (id: string) {
    return new EmbedBuilder<LookerEmbedExplore>(this, 'explore', LookerEmbedExplore).withId(id)
  }

  /**
   * Create an EmbedBuilder for an embedded Looker Look.
   *
   * @param url A signed SSO embed URL or embed URL for an already authenticated Looker user
   */

  static createLookWithUrl (url: string) {
    return new EmbedBuilder<LookerEmbedLook>(this, 'look', LookerEmbedLook).withUrl(url)
  }

  /**
   * Create an EmbedBuilder for an embedded Looker dashboard.
   *
   * @param id The ID of a Looker Look
   */

  static createLookWithId (id: number) {
    return new EmbedBuilder<LookerEmbedLook>(this, 'look', LookerEmbedLook).withId(id)
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
