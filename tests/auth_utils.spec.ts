/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2019 Looker Data Sciences, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import { createSignedUrl, LookerUserPermission } from '../server_utils/auth_utils'

const testUser = () => ({
  'external_user_id': 'user1',
  'first_name': 'Pat',
  'last_name': 'Embed',
  'session_length': 3600,
  'force_logout_login': true,
  'external_group_id': 'group1',
  'group_ids': [1, 2, 3],
  'permissions': [
    'access_data',
    'see_looks',
    'see_user_dashboards'
  ] as LookerUserPermission[],
  'models': ['powered_by', 'thelook'],
  'user_attributes': { 'locale': 'en_US' },
  'access_filters': { 'powered_by': { 'products.brand': 'Allegra K' } },
  'user_timezone': 'America/Los_Angeles'
})

const testUrl = '/embed/dashboards/1'
const testHost = 'test.looker.com'
const testSecret = 'hunter2'
const testNonce = 'abc123'

describe('createSignedUrl', () => {
  beforeEach(() => {
    jasmine.clock().install()
    jasmine.clock().mockDate(new Date(1561486800168))
  })

  afterEach(() => {
    jasmine.clock().uninstall()
  })

  it('creates a signed URL with properly encoded parameters', () => {
    const user = testUser()
    const signed = createSignedUrl(testUrl, user, testHost, testSecret, testNonce)

    expect(signed).toContain('external_user_id=%22user1%22')
    expect(signed).toContain('first_name=%22Pat%22')
    expect(signed).toContain('last_name=%22Embed%22')
    expect(signed).toContain('session_length=3600')
    expect(signed).toContain('force_logout_login=true')
    expect(signed).toContain('external_group_id=%22group1%22')
    expect(signed).toContain('group_ids=%5B1%2C2%2C3%5D')
    expect(signed).toContain('permissions=%5B%22access_data%22%2C%22see_looks%22%2C%22see_user_dashboards%22%5D')
    expect(signed).toContain('models=%5B%22powered_by%22%2C%22thelook%22%5D')
    expect(signed).toContain('user_attributes=%7B%22locale%22%3A%22en_US%22%7D')
    expect(signed).toContain('access_filters=%7B%22powered_by%22%3A%7B%22products.brand%22%3A%22Allegra%20K%22%7D%7D')
    expect(signed).toContain('user_timezone=%22America%2FLos_Angeles%22')
    expect(signed).toContain('time=1561486800')
    expect(signed).toContain('nonce=%22abc123%22')
    expect(signed).toContain('signature=jcMKWo4eb4Y34CV7dpC6hAgi8oM%3D')
  })

  it('creates a signed URL without optional non-signed parameters', () => {
    const user = testUser()
    delete user.first_name
    delete user.last_name
    delete user.user_timezone

    const signed = createSignedUrl(testUrl, user, testHost, testSecret, testNonce)
    expect(signed).not.toContain('first_name=')
    expect(signed).not.toContain('last_name=')
    expect(signed).not.toContain('user_timezone=')
    expect(signed).toContain('signature=jcMKWo4eb4Y34CV7dpC6hAgi8oM%3D')
  })

  it('creates a signed URL with a generated nonce', () => {
    const user = testUser()
    delete user.first_name
    delete user.last_name
    delete user.user_timezone

    const signed = createSignedUrl(testUrl, user, testHost, testSecret)
    expect(signed).toMatch('signature=[A-Za-z0-9%]+')
  })

  it('creates a signed URL without optional signed parameters', () => {
    const user = testUser()
    delete user.group_ids
    delete user.external_group_id
    delete user.user_attributes
    delete user.access_filters

    const signed = createSignedUrl(testUrl, user, testHost, testSecret, testNonce)
    expect(signed).not.toContain('group_ids=')
    expect(signed).not.toContain('external_group_id=')
    expect(signed).not.toContain('user_attributes=')
    // Access filters is deprecated but mandatory
    expect(signed).toContain('access_filters=%7B%7D')
    expect(signed).toContain('signature=RXMPyKsQerTI%2FfbPIwgoTqUsvio%3D')
  })

})
