/*

 MIT License

 Copyright (c) 2022 Looker Data Sciences, Inc.

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

export interface RuntimeConfig {
  [key: string]: any
  preventNavigation: boolean
  dashboardId: string
  dashboardId2: string
  exploreId: string
  extensionId: string
  lookId: string
  queryVisualizationId: string
  reportId: string
  lookerHost: string
  proxyPath: string
  /**
   * When false hides the look.
   */
  showDashboard: boolean
  /**
   * When false hides the look.
   */
  showLook: boolean
  /**
   * When false hides the explore.
   */
  showExplore: boolean
  /**
   * When false hides the extension.
   */
  showExtension: boolean
  /**
   * When false hides the query visualization.
   */
  showQueryVisualization: boolean
  /**
   * When false hides the report.
   */
  showReport: boolean
  /**
   * Dashboards only. When true, will dynamically change height of
   * dashboard IFRAME.
   */
  useDynamicHeights: boolean
  /**
   * Type of embedding to demonstrate
   */
  embedType: string
}

const lookerHost = 'mycompany.looker.com'

// A dashboard that the user can see. Set to '-' or '0' to disable the dashboard demo.
// dashboardId can be a numeric id string or a slug string.
const dashboardId = '1'
const dashboardId2 = '2'

// A Look that the user can see. Set to '-' or '0' to disable the look demo.
// Slugs are NOT supported.
const lookId = '1'

// An Explore that the user can see. Set to '-' to disable the explore demo.
const exploreId = 'thelook::orders'

// An Extension that the user can see. Set to '-' to disable the extension demo.
const extensionId = 'extension::my-great-extension'

// An Query Visualization that the user can see. Set to '-' to disable the
// query visualization demo.
const queryVisualizationId = 'O78fF73U3qNe3SelryY838'

const reportId = '17dc58ee-ffc0-49d1-9514-908666bfec8c'

const getId = (defaultId: string, id?: string) => {
  const _id = id || defaultId
  if (_id === '-' || _id === '0') {
    return ''
  }
  return _id
}

const _dashboardId = getId(dashboardId, process.env.LOOKER_DASHBOARD_ID)
const _dashboardId2 = getId(dashboardId2, process.env.LOOKER_DASHBOARD_ID_2)
const _exploreId = getId(exploreId, process.env.LOOKER_EXPLORE_ID)
const _extensionId = getId(extensionId, process.env.LOOKER_EXTENSION_ID)
const _lookId = getId(lookId, process.env.LOOKER_LOOK_ID)
const _queryVisualizationId = getId(
  queryVisualizationId,
  process.env.LOOKER_QUERY_VISUALIZATION_ID
)
const _reportId = getId(reportId, process.env.LOOKER_REPORT_ID)

// Current runtime config
let runtimeConfig: RuntimeConfig = {
  dashboardId: _dashboardId,
  dashboardId2: _dashboardId2,
  embedType: process.env.LOOKER_EMBED_TYPE || 'signed',
  exploreId: _exploreId,
  extensionId: _extensionId,
  lookId: _lookId,
  lookerHost:
    process.env.LOOKER_WEB_URL || process.env.LOOKER_EMBED_HOST || lookerHost,
  preventNavigation: true,
  proxyPath: process.env.LOOKER_DEMO_PROXY_PATH || '',
  queryVisualizationId: _queryVisualizationId,
  reportId: _reportId,
  showDashboard: _dashboardId.trim() !== '',
  showExplore: _exploreId.trim() !== '',
  showExtension: _extensionId.trim() !== '',
  showLook: _lookId.trim() !== '',
  showQueryVisualization: _queryVisualizationId.trim() !== '',
  showReport: _reportId.trim() !== '',
  useDynamicHeights: false,
}

const saveConfiguration = () => {
  localStorage.setItem('embed-configuration', JSON.stringify(runtimeConfig))
}

export const resetConfiguration = () => {
  localStorage.removeItem('embed-configuration')
}

export const getConfiguration = () => ({ ...runtimeConfig })

export const updateConfiguration = (config: RuntimeConfig) => {
  runtimeConfig = { ...config }
  saveConfiguration()
}

// load configuration from local storage UNLESS ids change
export const loadConfiguration = () => {
  try {
    const configJson = localStorage.getItem('embed-configuration')
    const config = JSON.parse(configJson || '{}') as RuntimeConfig
    if (
      config.lookerHost !== runtimeConfig.lookerHost ||
      config.dashboardId !== runtimeConfig.dashboardId ||
      config.dashboardId2 !== runtimeConfig.dashboardId2 ||
      config.lookId !== runtimeConfig.lookId ||
      config.extensionId !== runtimeConfig.extensionId ||
      config.exploreId !== runtimeConfig.exploreId ||
      config.queryVisualizationId !== runtimeConfig.queryVisualizationId ||
      config.reportId !== runtimeConfig.reportId
    ) {
      saveConfiguration()
    } else {
      runtimeConfig = { ...config }
    }
  } catch (error) {
    console.error('error loading embed-configuration', error)
  }
}
