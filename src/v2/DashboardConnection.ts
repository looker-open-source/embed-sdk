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

import type { LookerDashboardOptions, LookerEmbedFilterParams } from '../types'
import type { EmbedConnection } from './EmbedConnection'
import type { ILookerEmbedDashboard } from './types'

export class DashboardConnection implements ILookerEmbedDashboard {
  constructor(private _connection: EmbedConnection) {}

  run() {
    this._connection.send('dashboard:run')
  }

  stop() {
    this._connection.send('dashboard:stop')
  }

  edit() {
    this._connection.send('dashboard:edit')
  }

  updateFilters(params: LookerEmbedFilterParams) {
    this._connection.send('dashboard:filters:update', { filters: params })
  }

  setOptions(options: LookerDashboardOptions) {
    this._connection.send('dashboard:options:set', options)
  }

  async openScheduleDialog(): Promise<void> {
    return this._connection.sendAndReceive('dashboard:schedule_modal:open')
  }

  async loadDashboard(id: string, pushHistory = false): Promise<void> {
    return this._connection.loadId({ id, pushHistory, type: 'dashboards' })
  }
}