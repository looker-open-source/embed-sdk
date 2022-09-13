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

import * as createHmac from 'create-hmac'
import fetch from 'node-fetch'

function stringify(params: { [key: string]: string | undefined }) {
  const result: string[] = []
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
  return createHmac('sha1', secret)
    .update(forceUnicodeEncoding(stringToSign))
    .digest('base64')
    .trim()
}

function createNonce(len: number) {
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
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

export function createSignedUrl(
  src: string,
  user: LookerEmbedUser,
  host: string,
  secret: string,
  nonce?: string
) {
  const jsonTime = JSON.stringify(Math.floor(new Date().getTime() / 1000))
  const jsonNonce = JSON.stringify(nonce || createNonce(16))
  const params = {
    access_filters: JSON.stringify(user.access_filters || {}),
    external_group_id: JSON.stringify(user.external_group_id),
    external_user_id: JSON.stringify(user.external_user_id),
    first_name: JSON.stringify(user.first_name),
    force_logout_login: JSON.stringify(user.force_logout_login),
    group_ids: JSON.stringify(user.group_ids),
    last_name: JSON.stringify(user.last_name),
    models: JSON.stringify(user.models),
    nonce: jsonNonce,
    permissions: JSON.stringify(user.permissions),

    session_length: JSON.stringify(user.session_length),
    time: jsonTime,

    user_attributes: JSON.stringify(user.user_attributes),
    user_timezone: JSON.stringify(user.user_timezone),
  }

  const embedPath = '/login/embed/' + encodeURIComponent(src)

  const signingParams = {
    access_filters: params.access_filters,
    embed_path: embedPath,
    external_group_id: params.external_group_id,
    external_user_id: params.external_user_id,
    group_ids: params.group_ids,
    host,
    models: params.models,
    nonce: jsonNonce,
    permissions: params.permissions,
    session_length: params.session_length,
    time: jsonTime,
    user_attributes: params.user_attributes,
  }

  const signature = signEmbedUrl(signingParams, secret)

  Object.assign(params, { signature })

  return `https://${host}${embedPath}?${stringify(params)}`
}

let authToken: string
let authTokenExpiresAt = 0

const login = async (
  apiUrl: string,
  clientId: string,
  clientSecret: string
) => {
  if (new Date().getTime() > authTokenExpiresAt) {
    try {
      const resp = await fetch(`${apiUrl}/api/4.0/login`, {
        body: `client_id=${clientId}&client_secret=${clientSecret}`,
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
      })
      if (!resp.ok || (resp.status < 200 && resp.status > 299)) {
        console.error('login failed', { resp })
        throw new Error(`login failed: ${resp.status} ${resp.statusText}`)
      }
      const body = (await resp.json()) as {
        access_token: string
        expires_in: number
      }
      const { access_token, expires_in } = body
      authTokenExpiresAt = new Date().getTime() - 120000 + expires_in * 1000
      authToken = access_token
    } catch (err) {
      console.error('login failed', { err })
      throw err
    }
  }
}

let sessionReferenceTokenExpiresAt: number
let sessionReferenceToken: string
let apiToken: string
let navigationToken: string

const acquireSessionInternal = async (
  apiUrl: string,
  userAgent: string,
  user: LookerEmbedUser
) => {
  try {
    const request = {
      ...user,
      session_reference_token: sessionReferenceToken,
    }
    const resp = await fetch(
      `${apiUrl}/api/4.0/embed/cookieless_session/acquire`,
      {
        body: JSON.stringify(request),
        headers: {
          Authorization: `Bearer ${authToken}`,
          'content-type': 'application/json',
          'user-agent': userAgent,
        },
        method: 'POST',
      }
    )
    if (!resp.ok || (resp.status < 200 && resp.status > 299)) {
      console.error('session acquisition failed', { resp })
      throw new Error(
        `session acquisition failed: ${resp.status} ${resp.statusText}`
      )
    }
    const body = (await resp.json()) as any
    const {
      authentication_token,
      authentication_token_ttl,
      navigation_token,
      navigation_token_ttl,
      session_reference_token,
      session_reference_token_ttl,
      api_token,
      api_token_ttl,
    } = body
    navigationToken = navigation_token
    apiToken = api_token
    sessionReferenceToken = session_reference_token
    sessionReferenceTokenExpiresAt =
      new Date().getTime() + session_reference_token_ttl * 1000
    return {
      api_token,
      api_token_ttl,
      authentication_token,
      authentication_token_ttl,
      navigation_token,
      navigation_token_ttl,
      session_reference_token_ttl,
    }
  } catch (error) {
    console.error('session creation failed', { error })
    throw error
  }
}

export async function acquireSession(
  apiUrl: string,
  clientId: string,
  clientSecret: string,
  userAgent: string,
  user: LookerEmbedUser
) {
  await login(apiUrl, clientId, clientSecret)
  return acquireSessionInternal(apiUrl, userAgent, user)
}

export async function generateTokens(
  apiUrl: string,
  clientId: string,
  clientSecret: string,
  userAgent: string
) {
  if (new Date().getTime() >= sessionReferenceTokenExpiresAt) {
    console.error(
      'session reference token has expired. generate tokens will fail.'
    )
  }
  await login(apiUrl, clientId, clientSecret)
  try {
    const resp = await fetch(
      `${apiUrl}/api/4.0/embed/cookieless_session/generate_tokens`,
      {
        body: JSON.stringify({
          api_token: apiToken,
          navigation_token: navigationToken,
          session_reference_token: sessionReferenceToken,
        }),
        headers: {
          Authorization: `Bearer ${authToken}`,
          'content-type': 'application/json',
          'user-agent': userAgent,
        },
        method: 'PUT',
      }
    )
    if (!resp.ok || (resp.status < 200 && resp.status > 299)) {
      console.error('generate tokens failed', { resp })
      throw new Error(
        `generate tokens failed: ${resp.status} ${resp.statusText}`
      )
    }
    const body = (await resp.json()) as any
    const { api_token, api_token_ttl, navigation_token, navigation_token_ttl } =
      body
    apiToken = api_token
    navigationToken = navigation_token
    return { api_token, api_token_ttl, navigation_token, navigation_token_ttl }
  } catch (error) {
    console.error('generate tokens failed', { error })
    throw error
  }
}
