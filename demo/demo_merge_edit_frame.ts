/*

 MIT License

 Copyright (c) 2025 Looker Data Sciences, Inc.

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

import type {
  DashboardTileMergeEvent,
  ILookerConnection,
  ILookerEmbedSDK,
} from '../src/index'
import { getEmbedSDK } from '../src/index'
import type { RuntimeConfig } from './demo_config'
import { getConfiguration, loadConfiguration } from './demo_config'

let embedConnection: ILookerConnection

/**
 * Save the embed connection. This provides access to the undelying
 * functionality of each embed content type.
 */
const embedConnected = (connection: ILookerConnection) => {
  embedConnection = connection
  updateStatus('')
}

/**
 * Update the status for each embedded element
 */
const updateStatus = (status: string) => {
  const statusElement = document.querySelector('#embed-status')
  if (statusElement) {
    if (status) {
      statusElement.textContent = status
    } else {
      statusElement.innerHTML = '&nbsp;'
    }
  }
}

/**
 * Initialize controls.
 */
const initializeControls = () => {
  const runButton = document.querySelector('#close-merge')
  if (runButton) {
    runButton.addEventListener('click', () => {
      window.close()
    })
  }
}

/**
 * A canceller callback that prevents the default behavior of edit merge query.
 * The default behavior is for the edit merge query page to be opened in a top
 * level window.
 */
const openMergeQuery = (event: DashboardTileMergeEvent): any => {
  if (
    event.dashboard_modified &&
    !window.confirm(
      'The dashboard has unsaved changes which may be lost if the merge query is edited. Proceed?'
    )
  ) {
    return
  }
  window.open(`/merge_edit?merge_url=${encodeURI(event.url)}`)
  updateStatus('Merge query edit opened in a new window')
  return { cancel: true }
}

/**
 * The merge edit url is stored in history state
 */
const getEmbedMergeEditUrl = () => {
  const embedUrl = decodeURI(history.state?.merge_url || '')
  return embedUrl || '/embed/preload'
}

/**
 * Render the embedded merge edit page.
 */
const createEmbed = (sdk: ILookerEmbedSDK) => {
  const abortController = new AbortController()
  const signal = abortController.signal
  let timeoutId: any = setTimeout(() => {
    abortController.abort(
      `Connection attempt timed out. Please check that ${location.origin} has been allow listed`
    )
    timeoutId = undefined
  }, 60000)
  sdk
    .createWithUrl(getEmbedMergeEditUrl())
    .appendTo('#embed-container')
    // // Open merge query in its own window
    .on('dashboard:tile:merge', openMergeQuery)
    .on('session:expired', () => updateStatus('Session Expired'))
    .withClassName('looker-embed')
    .build()
    // Connect to Looker
    .connect({ signal, waitUntilLoaded: true })
    // Finish up setup
    .then((connection) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = undefined
      }
      embedConnected(connection)
    })
    // Log if something went wrong
    .catch((error: any) => {
      updateStatus(typeof error === 'string' ? error : 'Connection error')
      console.error('Connection error', error)
    })
}

/**
 * Initialize the SDK. lookerHost is the address of the Looker instance. It is configured in
 * democonfig.ts. lookerHost needs to be set for messages to be exchanged from the host
 * document to the embedded content. The auth endpoint is documented in README.md.
 */
const initializeEmbedSdk = (runtimeConfig: RuntimeConfig) => {
  const sdk: ILookerEmbedSDK = getEmbedSDK()
  if (runtimeConfig.embedType === 'cookieless') {
    // Use cookieless embed
    sdk.initCookieless(
      runtimeConfig.lookerHost,
      `${runtimeConfig.proxyPath}/acquire-embed-session`,
      `${runtimeConfig.proxyPath}/generate-embed-tokens`
    )
  } else if (runtimeConfig.embedType === 'private') {
    // Use private embedding
    sdk.init(runtimeConfig.lookerHost)
  } else {
    // Use SSO embed
    sdk.init(runtimeConfig.lookerHost, `${runtimeConfig.proxyPath}/auth`)
  }
  // Now preload the embed
  createEmbed(sdk)
}

/**
 * Event listener to create embedded content. Waits until DOM is loaded so that
 * all the parent elements are present.
 */
document.addEventListener('DOMContentLoaded', function () {
  // Hide merge url from end user
  const searchParams = new URLSearchParams(location.search)
  if (searchParams.has('merge_url')) {
    history.replaceState(
      { merge_url: searchParams.get('merge_url') },
      '',
      location.pathname
    )
  }
  loadConfiguration()
  initializeControls()
  const runtimeConfig = getConfiguration()
  initializeEmbedSdk(runtimeConfig)
})
