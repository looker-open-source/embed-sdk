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
  group_ids?: string[]
  external_group_id?: string
  user_attributes?: { [key: string]: any }
  user_timezone?: string | null
  access_filters?: { [key: string]: any }
}
