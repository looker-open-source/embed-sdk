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

import * as createHmac from 'create-hmac'
import fetch from 'node-fetch'

function stringify(params: { [key: string]: string | undefined }) {
  const result = []
  for (const key in params) {
    const param = params[key]
    if (typeof param === 'string') {
      result.push(`${key}=${encodeURIComponent(param)}`)
    }
  }
  return result.join('&')
}

function forceUnicodeEncoding(val: string) {
  return decodeURIComponent(encodeURIComponent(val))
}

function signEmbedUrl(data: { [key: string]: string }, secret: string) {
  const stringsToSign = [
    data.host,
    data.embed_path,
    data.nonce,
    data.time,

    data.session_length,
    data.external_user_id,
    data.permissions,
    data.models,
  ]
  if (data.group_ids) stringsToSign.push(data.group_ids)
  if (data.external_group_id) stringsToSign.push(data.external_group_id)
  if (data.user_attributes) stringsToSign.push(data.user_attributes)
  stringsToSign.push(data.access_filters)

  const stringToSign = stringsToSign.join('\n')
  return createHmac('sha1', secret).update(forceUnicodeEncoding(stringToSign)).digest('base64').trim()
}

function createNonce(len: number) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let text = ''

  for (let i = 0; i < len; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }

  return text
}

export type LookerUserPermission =
  | 'access_data'
  | 'see_looks'
  | 'see_user_dashboards'
  | 'see_lookml_dashboards'
  | 'explore'
  | 'create_table_calculations'
  | 'download_with_limit'
  | 'download_without_limit'
  | 'see_drill_overlay'
  | 'see_sql'
  | 'save_content'
  | 'embed_browse_spaces'
  | 'schedule_look_emails'
  | 'send_to_sftp'
  | 'send_to_s3'
  | 'send_outgoing_webhook'
  | 'schedule_external_look_emails'

export interface LookerEmbedUser {
  external_user_id: string
  first_name?: string
  last_name?: string
  session_length: number
  force_logout_login: boolean
  permissions: LookerUserPermission[]
  models: string[]
  group_ids?: number[]
  external_group_id?: string
  user_attributes?: { [key: string]: any }
  user_timezone?: string | null
  access_filters?: { [key: string]: any }
}

export function createSignedUrl(src: string, user: LookerEmbedUser, host: string, secret: string, nonce?: string) {
  const jsonTime = JSON.stringify(Math.floor(new Date().getTime() / 1000))
  const jsonNonce = JSON.stringify(nonce || createNonce(16))
  const params = {
    external_user_id: JSON.stringify(user.external_user_id),
    first_name: JSON.stringify(user.first_name),
    last_name: JSON.stringify(user.last_name),
    permissions: JSON.stringify(user.permissions),
    models: JSON.stringify(user.models),
    group_ids: JSON.stringify(user.group_ids),
    user_attributes: JSON.stringify(user.user_attributes),
    external_group_id: JSON.stringify(user.external_group_id),
    access_filters: JSON.stringify(user.access_filters || {}),
    user_timezone: JSON.stringify(user.user_timezone),

    force_logout_login: JSON.stringify(user.force_logout_login),
    session_length: JSON.stringify(user.session_length),

    nonce: jsonNonce,
    time: jsonTime,
  }

  const embedPath = '/login/embed/' + encodeURIComponent(src)

  const signingParams = {
    host,
    embed_path: embedPath,
    nonce: jsonNonce,
    time: jsonTime,
    session_length: params.session_length,
    external_user_id: params.external_user_id,
    permissions: params.permissions,
    models: params.models,
    group_ids: params.group_ids,
    external_group_id: params.external_group_id,
    user_attributes: params.user_attributes,
    access_filters: params.access_filters,
  }

  const signature = signEmbedUrl(signingParams, secret)

  Object.assign(params, { signature })

  return `https://${host}${embedPath}?${stringify(params)}`
}

let authToken: string
let authTokenExpiresAt = 0

const login = async (apiUrl: string, clientId: string, clientSecret: string) => {
  if (new Date().getTime() > authTokenExpiresAt) {
    try {
      const resp = await fetch(`${apiUrl}/api/4.0/login`, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: `client_id=${clientId}&client_secret=${clientSecret}`,
      })
      if (!resp.ok || (resp.status < 200 && resp.status > 299)) {
        console.error('login failed', { resp })
        throw new Error(`login failed: ${resp.status} ${resp.statusText}`)
      }
      const body = (await resp.json()) as { access_token: string; expires_in: number }
      const { access_token, expires_in } = body
      authTokenExpiresAt = new Date().getTime() - 120000 + expires_in * 1000
      authToken = access_token
    } catch (err) {
      console.error('login failed', { err })
      throw err
    }
  }
}

let refreshTokenExpiresAt: number
let refreshToken: string
let apiToken: string
let navigationToken: string

const prepareSession = async (apiUrl: string, userAgent: string, user: LookerEmbedUser) => {
  try {
    const resp = await fetch(`${apiUrl}/api/4.0/embed/cookieless/session_prepare`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'user-agent': userAgent,
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(user),
    })
    if (!resp.ok || (resp.status < 200 && resp.status > 299)) {
      console.error('session creation failed', { resp })
      throw new Error(`session creation failed: ${resp.status} ${resp.statusText}`)
    }
    const body = (await resp.json()) as any
    const {
      authentication_token,
      authentication_token_ttl,
      navigation_token,
      navigation_token_ttl,
      refresh_token,
      refresh_token_ttl,
      api_token,
      api_token_ttl,
      session_ttl,
    } = body
    navigationToken = navigation_token
    apiToken = api_token
    refreshToken = refresh_token
    refreshTokenExpiresAt = new Date().getTime() + refresh_token_ttl * 1000
    return {
      authentication_token,
      authentication_token_ttl,
      navigation_token,
      navigation_token_ttl,
      api_token,
      api_token_ttl,
      session_ttl,
    }
  } catch (error) {
    console.error('session creation failed', { error })
    throw error
  }
}

export async function prepareCookielessSession(
  apiUrl: string,
  clientId: string,
  clientSecret: string,
  userAgent: string,
  user: LookerEmbedUser
) {
  await login(apiUrl, clientId, clientSecret)
  return await prepareSession(apiUrl, userAgent, user)
}

export async function refreshApiToken(apiUrl: string, clientId: string, clientSecret: string, userAgent: string) {
  if (new Date().getTime() >= refreshTokenExpiresAt) {
    console.error('refresh token has expired. refresh api token will fail.')
  }
  login(apiUrl, clientId, clientSecret)
  try {
    const resp = await fetch(`${apiUrl}/api/4.0/embed/cookieless/refresh_tokens`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        'user-agent': userAgent,
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ refresh_token: refreshToken, api_token: apiToken, navigation_token: navigationToken }),
    })
    if (!resp.ok || (resp.status < 200 && resp.status > 299)) {
      console.error('refresh api token failed', { resp })
      throw new Error(`refresh api token failed: ${resp.status} ${resp.statusText}`)
    }
    const body = (await resp.json()) as any
    const { api_token, api_token_ttl, navigation_token, navigation_token_ttl } = body
    apiToken = apiToken
    navigationToken = navigation_token
    return { api_token, api_token_ttl, navigation_token, navigation_token_ttl }
  } catch (error) {
    console.error('refresh api token failed', { error })
    throw error
  }
}
