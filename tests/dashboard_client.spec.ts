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

import { LookerEmbedDashboard } from '../src/dashboard_client'
import { ChattyHostConnection } from '@looker/chatty'

describe('LookerEmbedDashboard', () => {
  let sendSpy: jasmine.Spy
  let sendAndReceiveSpy: jasmine.Spy
  let host: ChattyHostConnection
  let client: LookerEmbedDashboard

  beforeEach(() => {
    sendSpy = jasmine.createSpy()
    sendAndReceiveSpy = jasmine.createSpy()
    host = {
      send: sendSpy,
      sendAndReceive: sendAndReceiveSpy
    }
    client = new LookerEmbedDashboard(host)
  })

  it('it relays messages', () => {
    client.send('a:message', { some: 'params' })
    expect(sendSpy).toHaveBeenCalledWith('a:message', { some: 'params' })
  })

  it('it runs', () => {
    client.run()
    expect(sendSpy).toHaveBeenCalledWith('dashboard:run', undefined)
  })

  it('it sets filters', () => {
    client.updateFilters({ 'alpha': 'beta' })
    expect(sendSpy).toHaveBeenCalledWith('dashboard:filters:update', { filters: { 'alpha': 'beta' } })
  })

  it('it sets options', () => {
    client.setOptions({
      elements: {},
      layouts: []
    })
    expect(sendSpy).toHaveBeenCalledWith('dashboard:options:set', { elements: {}, layouts: [] })
  })

  it('opens shedule dialog', async () => {
    await client.openScheduleDialog()
    expect(sendAndReceiveSpy).toHaveBeenCalledWith('dashboard:schedule_modal:open', undefined)
  })

  it('loads', async () => {
    await client.loadDashboard('1')
    expect(sendAndReceiveSpy).toHaveBeenCalledWith('dashboard:load', { id: '1', pushHistory: false })
  })

  it('loads and pushes history', async () => {
    await client.loadDashboard('1', true)
    expect(sendAndReceiveSpy).toHaveBeenCalledWith('dashboard:load', { id: '1', pushHistory: true })
  })

  it('stops', () => {
    client.stop()
    expect(sendSpy).toHaveBeenCalledWith('dashboard:stop', undefined)
  })
})
