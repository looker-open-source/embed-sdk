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

// IDs for content to demonstrate are configured in demo_config.ts

import type {
  LookerEmbedCookielessSessionData,
  PagePropertiesChangedEvent,
} from '../src/index'
import {
  initSSOEmbed,
  initCookielessEmbed,
  addEmbedFrame,
  deleteEmbedFrame,
  getEmbedFrame,
  getApplicationTokens,
} from './message_utils'
import type { RuntimeConfig } from './demo_config'
import {
  getConfiguration,
  updateConfiguration,
  loadConfiguration,
  resetConfiguration,
} from './demo_config'

/**
 * Acquire a cookieless embed session. The embed host is expected
 * to implement an endpoint the calls the Looker `acquire_embed_cookieless_session`
 * endpoint. This endpoint will either create a session OR attach to
 * an existing session. This allows multiple IFRAMES to be attached
 * to the same session.
 */
const acquireEmbedSessionCallback =
  async (): Promise<LookerEmbedCookielessSessionData> => {
    const resp = await fetch('/acquire-embed-session')
    if (!resp.ok) {
      console.error('acquire-embed-session failed', { resp })
      throw new Error(
        `acquire-embed-session failed: ${resp.status} ${resp.statusText}`
      )
    }
    return (await resp.json()) as LookerEmbedCookielessSessionData
  }

/**
 * Generate new embed tokens. The embed host is expected to implement
 * an endpoint that calls the Looker `generate_tokens_for_cookieless_session`
 * endpoint. Cookieless embed provides relatively short lived tokens that
 * need to be regenerated on a regular basis. The embedded Looker UI keeps
 * track of the time to live for these tokens and as they get close to
 * expiration will ask for the tokens to be regenerated. This callback is
 * called when the tokens need to be regenerated.
 */
const generateEmbedTokensCallback =
  async (): Promise<LookerEmbedCookielessSessionData> => {
    const { api_token, navigation_token } = getApplicationTokens() || {}
    const resp = await fetch('/generate-embed-tokens', {
      body: JSON.stringify({ api_token, navigation_token }),
      headers: { 'content-type': 'application/json' },
      method: 'PUT',
    })
    if (!resp.ok) {
      // A response status of 400 is currently unrecoverable.
      // Terminate the session.
      if (resp.status === 400) {
        return { session_reference_token_ttl: 0 }
      }
      console.error('generate-embed-tokens failed', { resp })
      throw new Error(
        `generate-embed-tokens failed: ${resp.status} ${resp.statusText}`
      )
    }
    return (await resp.json()) as LookerEmbedCookielessSessionData
  }

/**
 * Update the status for each embedded element
 */
const updateStatus = (selector: string, state: string) => {
  const stateElement = document.querySelector(selector)
  if (stateElement) {
    stateElement.textContent = state
  }
}

/**
 * Embed event listener. It should be noted that the embed
 * javascript API CANNOT support cancelling of events.
 */
const embedEventListener = (event: any): any => {
  updateStatus('#dashboard-state', `${event.label} clicked`)
  return {}
}

/**
 * A page properties changed handler that can be used to control the height of the
 * embedded IFRAME. Different dashboards can be displayed by either calling the
 * `loadDashboard` Embed SDK method OR by using the inbuilt embed content navigation
 * feature. Whenever, the dashboard changes a `page:properties:changed` event is
 * fired and this event contains the height of the dashboard content.
 */
const pagePropertiesChangedHandler = (
  { height }: PagePropertiesChangedEvent,
  elementId: string
) => {
  const { useDynamicHeights } = getConfiguration()
  if (useDynamicHeights && height && height > 100) {
    const element = document.querySelector(
      `#${elementId} iframe`
    ) as HTMLIFrameElement
    if (element) {
      element.style.height = `${height}px`
    }
  }
}

/**
 * Initialize the show dashboard configuration checkbox.
 */
const initializeShowDashboardCheckbox = () => {
  const cb = document.getElementById('showDashboard') as HTMLInputElement
  if (cb) {
    const { dashboardId, showDashboard } = getConfiguration()
    if (dashboardId) {
      cb.checked = showDashboard
      cb.addEventListener('change', (event: any) => {
        const runtimeConfig = getConfiguration()
        runtimeConfig.showDashboard = event.target.checked
        updateConfiguration(runtimeConfig)
        renderDashboard(runtimeConfig)
      })
    } else {
      cb.parentElement!.style.display = 'none'
    }
  }
}

/**
 * Initialize the show look configuration checkbox.
 */
const initializeShowLookCheckbox = () => {
  const cb = document.getElementById('showLook') as HTMLInputElement
  if (cb) {
    const { lookId, showLook } = getConfiguration()
    if (lookId) {
      cb.checked = showLook
      cb.addEventListener('change', (event: any) => {
        const runtimeConfig = getConfiguration()
        runtimeConfig.showLook = event.target.checked
        updateConfiguration(runtimeConfig)
        renderLook(runtimeConfig)
      })
    } else {
      cb.parentElement!.style.display = 'none'
    }
  }
}

/**
 * Initialize the use cookieless configuration checkbox.
 */
const initializeUseCookielessCheckbox = () => {
  const cb = document.getElementById('useCookieless') as HTMLInputElement
  if (cb) {
    const { useCookieless } = getConfiguration()
    cb.checked = useCookieless
    cb.addEventListener('change', (event: any) => {
      const runtimeConfig = getConfiguration()
      runtimeConfig.useCookieless = event.target.checked
      updateConfiguration(runtimeConfig)
      location.reload()
    })
  }
}

/**
 * Initialize the prevent navigation configuration checkbox.
 */
const initializePreventNavigationCheckbox = () => {
  const cb = document.getElementById('preventNavigation') as HTMLInputElement
  if (cb) {
    const { preventNavigation } = getConfiguration()
    cb.checked = preventNavigation
    cb.addEventListener('change', (event: any) => {
      const runtimeConfig = getConfiguration()
      runtimeConfig.preventNavigation = event.target.checked
      updateConfiguration(runtimeConfig)
    })
  }
}

/**
 * Initialize the use dynamic heights configuration checkbox.
 */
const initializeUseDynamicHeightsCheckbox = () => {
  const cb = document.getElementById('useDynamicHeights') as HTMLInputElement
  if (cb) {
    const { useDynamicHeights } = getConfiguration()
    cb.checked = useDynamicHeights
    cb.addEventListener('change', (event: any) => {
      const runtimeConfig = getConfiguration()
      runtimeConfig.useDynamicHeights = event.target.checked
      updateConfiguration(runtimeConfig)
      location.reload()
    })
  }
}

/**
 * Initialize the reset configuration button.
 */
const initializeResetConfigButton = () => {
  const b = document.getElementById('reset-config') as HTMLInputElement
  if (b) {
    b.addEventListener('click', () => {
      resetConfiguration()
      location.reload()
    })
  }
}

/**
 * Initialize configuration controls.
 */
const initializeConfigurationControls = () => {
  initializeShowDashboardCheckbox()
  initializeShowLookCheckbox()
  initializePreventNavigationCheckbox()
  initializeUseCookielessCheckbox()
  initializeUseDynamicHeightsCheckbox()
  initializeResetConfigButton()
}

/**
 * Get the id of the dashboard IFRAME
 */
const getDashboardFrameId = ({ dashboardId }: RuntimeConfig) =>
  `embed-dasboard-${dashboardId}`

/**
 * Initialize the dashboard controls
 */
const initializeDashboardControls = (runtimeConfig: RuntimeConfig) => {
  // Add a listener to the dashboard's "Run" button and send a 'dashboard:run' message when clicked
  const runButton = document.querySelector('#run-dashboard')
  if (runButton) {
    runButton.addEventListener('click', () =>
      getEmbedFrame(getDashboardFrameId(runtimeConfig))?.send('dashboard:run')
    )
  }

  // Add a listener to the dashboard's "Send session token" button and send a 'session:tokens' message when clicked
  const stopButton = document.querySelector('#stop-dashboard')
  if (stopButton) {
    stopButton.addEventListener('click', () =>
      getEmbedFrame(getDashboardFrameId(runtimeConfig))?.send('dashboard:stop')
    )
  }

  // Add a listener to the state selector and update the dashboard filters when changed
  const stateFilter = document.querySelector('#state')
  if (stateFilter) {
    stateFilter.addEventListener('change', (event) => {
      getEmbedFrame(getDashboardFrameId(runtimeConfig))?.send(
        'dashboard:filters:update',
        {
          filters: {
            State: (event.target as HTMLSelectElement).value,
          },
        }
      )
      getEmbedFrame(getDashboardFrameId(runtimeConfig))?.send('dashboard:run')
    })
  }
}

/**
 * Render a dashboard. When active this sets up listeners
 * for events that can be sent by the embedded Looker UI.
 */
const renderDashboard = (
  runtimeConfig: RuntimeConfig,
  qs = '',
  recoverableError?: boolean
) => {
  if (runtimeConfig.showDashboard) {
    const { dashboardId } = runtimeConfig
    document.querySelector<HTMLDivElement>('#demo-dashboard')!.style.display =
      ''
    addEmbedFrame(
      getDashboardFrameId(runtimeConfig),
      `/dashboards/${dashboardId}${qs}`,
      'dashboard',
      'looker-embed',
      recoverableError
    )
      .on('dashboard:loaded', () => updateStatus('#dashboard-state', 'Loaded'))
      .on('dashboard:run:start', () =>
        updateStatus('#dashboard-state', 'Running')
      )
      .on('dashboard:run:complete', () =>
        updateStatus('#dashboard-state', 'Done')
      )
      // Listen to messages that change dashboard
      .on('dashboard:save:complete', () =>
        updateStatus('#dashboard-state', 'Saved')
      )
      .on('dashboard:delete:complete', () =>
        updateStatus('#dashboard-state', 'Deleted')
      )
      .on('page:properties:changed', (event: PagePropertiesChangedEvent) => {
        pagePropertiesChangedHandler(event, 'dashboard')
      })
      // Listen to messages to prevent the user from navigating away
      .on('drillmenu:click', embedEventListener)
      .on('drillmodal:explore', embedEventListener)
      .on('dashboard:tile:explore', embedEventListener)
      .on('dashboard:tile:view', embedEventListener)
      .connect()
  } else {
    document.querySelector<HTMLDivElement>('#demo-dashboard')!.style.display =
      'none'
    deleteEmbedFrame(getDashboardFrameId(runtimeConfig))
  }
}

/**
 * Render a look. When active this sets up listeners
 * for events that can be sent by the embedded Looker UI.
 */
const renderLook = (runtimeConfig: RuntimeConfig) => {
  if (runtimeConfig.showLook) {
    const { lookId } = runtimeConfig
    document.querySelector<HTMLDivElement>('#demo-look')!.style.display = ''
    addEmbedFrame(
      getLookFrameId(runtimeConfig),
      `/looks/${lookId}`,
      'look',
      'looker-embed'
    )
      .on('look:ready', () => updateStatus('#look-state', 'Loaded'))
      .on('look:run:start', () => updateStatus('#look-state', 'Running'))
      .on('look:run:complete', () => updateStatus('#look-state', 'Done'))
      // Listen to messages that change the look
      .on('look:save:complete', () => updateStatus('#look-state', 'Saved'))
      .on('dashboard:delete:complete', () =>
        updateStatus('#look-state', 'Deleted')
      )
      .connect()
  } else {
    document.querySelector<HTMLDivElement>('#demo-look')!.style.display = 'none'
    deleteEmbedFrame(getLookFrameId(runtimeConfig))
  }
}

/**
 * Get the id of the look IFRAME
 */
const getLookFrameId = ({ lookId }: RuntimeConfig) => `embed-dasboard-${lookId}`

/**
 * Initialize the dashboard controls
 */
const initializeLookControls = (runtimeConfig: RuntimeConfig) => {
  // Add a listener to the look's "Run" button and send a 'look:run' message when clicked
  const runButton = document.querySelector('#run-look')
  if (runButton) {
    runButton.addEventListener('click', () =>
      getEmbedFrame(getLookFrameId(runtimeConfig))?.send('look:run')
    )
  }

  // Add a listener to the state selector and update the look filters when changed
  const stateFilter = document.querySelector('#state')
  if (stateFilter) {
    stateFilter.addEventListener('change', (event) => {
      getEmbedFrame(getLookFrameId(runtimeConfig))?.send(
        'look:filters:update',
        {
          filters: {
            State: (event.target as HTMLSelectElement).value,
          },
        }
      )
      getEmbedFrame(getLookFrameId(runtimeConfig))?.send('look:run')
    })
  }
}

/**
 * Initialize Looker Embed. lookerHost is the address of the Looker instance. It is configured in
 * democonfig.ts. lookerHost needs to be set for messages to be exchanged from the host
 * document to the embedded content. The auth endpoint is documented in README.md.
 */
const initializeLookerEmbed = (runtimeConfig: RuntimeConfig) => {
  if (runtimeConfig.useCookieless) {
    // Use cookieless embed
    initCookielessEmbed(
      runtimeConfig.lookerHost,
      acquireEmbedSessionCallback,
      generateEmbedTokensCallback
    )
  } else {
    // Use SSO embed
    initSSOEmbed(runtimeConfig.lookerHost, '/auth')
  }
}

/**
 * Initialize the run all button
 */
const initializeRunAllButton = (runtimeConfig: RuntimeConfig) => {
  // Add a listener to the "Run All" button and send 'xxxx:run' messages when clicked
  const runAllButton = document.querySelector('#run-all')
  if (runAllButton) {
    runAllButton.addEventListener('click', () => {
      getEmbedFrame(getDashboardFrameId(runtimeConfig))?.send('dashboard:run')
      getEmbedFrame(getLookFrameId(runtimeConfig))?.send('look:run')
    })
  }
}

/**
 * Do not use any of the following as an example. The following
 * tests out edge cases for cookieless login,
 */
const initializeErrorControls = (runtimeConfig: RuntimeConfig) => {
  if (runtimeConfig.showDashboard) {
    const controls = document.querySelector('.error-controls') as HTMLDivElement
    if (controls) {
      if (runtimeConfig.useCookieless) {
        // Test unrecoverable initial connection
        const error1 = document.getElementById('error-1') as HTMLButtonElement
        if (error1) {
          error1.addEventListener('click', () => {
            // Hide the dashboard
            renderDashboard({ ...runtimeConfig, showDashboard: false })
            // Need to wait a bit for current dashboard to unload
            setTimeout(() => {
              // sdk=2 is a deliberate mistake. It tells the embedded Looker
              // application that the embed SDK is being used. In this case
              // it is not. The Looker application is going to timeout because
              // it fails to get a handshake. This is considered a coding error
              // on the part of the embedding application (this) and is unrecoverable.
              // Note that the Looker application displays an explanatory message in the console.
              renderDashboard({ ...runtimeConfig }, '?sdk=2')
            }, 500)
          })
        }
        // Test recoverable initial connection
        const error2 = document.getElementById('error-2') as HTMLButtonElement
        if (error2) {
          error2.addEventListener('click', () => {
            // Hide the dashboard
            renderDashboard({ ...runtimeConfig, showDashboard: false })
            // Need to wait a bit for current dashboard to unload
            setTimeout(() => {
              // Recoverable error ignores the first three requests for session
              // tokens. The Looker UI tries three times. This causes the Looker
              // UI to render a recoverable error display. The user can click a
              // button to try again and this time the session reques will not
              // be ignored.
              renderDashboard({ ...runtimeConfig }, '', true)
            }, 500)
          })
        }
        // Simulate bad tokens
        const error3 = document.getElementById('error-3') as HTMLButtonElement
        if (error3) {
          error3.addEventListener('click', () => {
            getEmbedFrame(getDashboardFrameId(runtimeConfig))?.send(
              'session:tokens',
              {}
            )
          })
        }
        // Simulate expired session
        const error4 = document.getElementById('error-4') as HTMLButtonElement
        if (error4) {
          error4.addEventListener('click', () => {
            getEmbedFrame(getDashboardFrameId(runtimeConfig))?.send(
              'session:tokens',
              { ...getApplicationTokens(), session_reference_token_ttl: 0 }
            )
          })
        }
      } else {
        controls.style.display = 'none'
      }
    }
  }
}

/**
 * Event listener to create embedded content. Waits until DOM is loaded so that
 * all the parent elements are present.
 */
document.addEventListener('DOMContentLoaded', function () {
  loadConfiguration()
  initializeConfigurationControls()
  const runtimeConfig = getConfiguration()
  initializeRunAllButton(runtimeConfig)
  initializeErrorControls(runtimeConfig)
  initializeDashboardControls(runtimeConfig)
  initializeLookControls(runtimeConfig)
  initializeLookerEmbed(runtimeConfig)
  renderDashboard(runtimeConfig)
  renderLook(runtimeConfig)
})
