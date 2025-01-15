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

import type { LookerEmbedFilterParams, ILookerEmbedExplore } from './types'
import type { EmbedConnection } from './EmbedConnection'

/**
 * Client that communicates with an embedded Looker explore. Messages are documented
 * [here](https://docs.looker.com/r/sdk/events)
 */

export class ExploreConnection implements ILookerEmbedExplore {
  constructor(private _connection: EmbedConnection) {}

  /**
   * Convenience method for sending a run message to the embedded Explore.
   */

  run() {
    // This is correct!
    this._connection.send('look:run')
  }

  /**
   * Convenience method for updating the filters of the embedded Explore.
   *
   * @param filters A set of filter parameters to update
   */

  updateFilters(params: LookerEmbedFilterParams) {
    // This is correct!
    this._connection.send('look:filters:update', { filters: params })
  }
}
