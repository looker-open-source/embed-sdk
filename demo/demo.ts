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
  LookerEmbedLook,
  LookerEmbedDashboard,
  LookerEmbedCookielessSessionData,
  LookerEmbedExplore,
  PagePropertiesChangedEvent,
} from '../src/index'
import { LookerEmbedSDK } from '../src/index'
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
    const resp = await fetch('/generate-embed-tokens')
    if (!resp.ok) {
      console.error('generate-embed-tokens failed', { resp })
      throw new Error(
        `generate-embed-tokens failed: ${resp.status} ${resp.statusText}`
      )
    }
    return (await resp.json()) as LookerEmbedCookielessSessionData
  }

/**
 * Set up the dashboard after the SDK connects
 */
const setupDashboard = (dashboard: LookerEmbedDashboard) => {
  // Add a listener to the "Run All" button and send a 'dashboard:run' message when clicked
  const runAllButton = document.querySelector('#run-all')
  if (runAllButton) {
    runAllButton.addEventListener('click', () => dashboard.run())
  }

  // Add a listener to the dashboard's "Run" button and send a 'dashboard:run' message when clicked
  const runButton = document.querySelector('#run-dashboard')
  if (runButton) {
    runButton.addEventListener('click', () => dashboard.run())
  }

  // Add a listener to the dashboard's "Send session token" button and send a 'session:token' message when clicked
  const stopButton = document.querySelector('#stop-dashboard')
  if (stopButton) {
    stopButton.addEventListener('click', () => dashboard.stop())
  }

  // Add a listener to the dashboard's "Edit" button and send a 'dashboard:edit' message when clicked
  const editButton = document.querySelector('#edit-dashboard')
  if (editButton) {
    editButton.addEventListener('click', () => dashboard.edit())
  }

  // Add a listener to the state selector and update the dashboard filters when changed
  const stateFilter = document.querySelector('#state')
  if (stateFilter) {
    stateFilter.addEventListener('change', (event) => {
      dashboard.updateFilters({
        'State / Region': (event.target as HTMLSelectElement).value,
      })
    })
  }
}

/**
 * Set up the look after the SDK connects.
 */
const setupLook = (look: LookerEmbedLook) => {
  // Add a listener to the "Run All" button and send a 'look:run' message when clicked
  const runAllButton = document.querySelector('#run-all')
  if (runAllButton) {
    runAllButton.addEventListener('click', () => look.run())
  }

  // Add a listener to the look's "Run" button and send a 'look:run' message when clicked
  const runButton = document.querySelector('#run-look')
  if (runButton) {
    runButton.addEventListener('click', () => look.run())
  }

  // Add a listener to the state selector and update the look filters when changed
  const stateFilter = document.querySelector('#state')
  if (stateFilter) {
    stateFilter.addEventListener('change', (event) => {
      look.updateFilters({
        'users.state': (event.target as HTMLSelectElement).value,
      })
    })
  }
}

/**
 * Set up the explore after the SDK connects.
 */
const setupExplore = (explore: LookerEmbedExplore) => {
  // Add a listener to the "Run All" button and send a 'look:run' message when clicked
  const runAllButton = document.querySelector('#run-all')
  if (runAllButton) {
    runAllButton.addEventListener('click', () => explore.run())
  }

  // Add a listener to the explore's "Run" button and send a 'explore:run' message when clicked
  const runButton = document.querySelector('#run-explore')
  if (runButton) {
    runButton.addEventListener('click', () => explore.run())
  }

  // Add a listener to the state selector and update the look filters when changed
  const stateFilter = document.querySelector('#state')
  if (stateFilter) {
    stateFilter.addEventListener('change', (event) => {
      explore.updateFilters({
        'users.state': (event.target as HTMLSelectElement).value,
      })
    })
  }
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
 * A canceller callback can prevent the default behavior of links on a dashboard.
 * In this instance, if the click will navigate to a new window, the navigation is
 * cancelled.
 */
const preventNavigation = (event: any): any => {
  const { preventNavigation } = getConfiguration()
  if (preventNavigation) {
    updateStatus('#dashboard-state', `${event.label} clicked`)
    return { cancel: !event.modal }
  }
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
 * Initialize the show explore configuration checkbox.
 */
const initializeShowExploreCheckbox = () => {
  const cb = document.getElementById('showExplore') as HTMLInputElement
  if (cb) {
    const { exploreId, showExplore } = getConfiguration()
    if (exploreId) {
      cb.checked = showExplore
      cb.addEventListener('change', (event: any) => {
        const runtimeConfig = getConfiguration()
        runtimeConfig.showExplore = event.target.checked
        updateConfiguration(runtimeConfig)
        renderExplore(runtimeConfig)
      })
    } else {
      cb.parentElement!.style.display = 'none'
    }
  }
}

/**
 * Initialize the show extension configuration checkbox.
 */
const initializeShowExtensionCheckbox = () => {
  const cb = document.getElementById('showExtension') as HTMLInputElement
  if (cb) {
    const { extensionId, showExtension } = getConfiguration()
    if (extensionId) {
      cb.checked = showExtension
      cb.addEventListener('change', (event: any) => {
        const runtimeConfig = getConfiguration()
        runtimeConfig.showExtension = event.target.checked
        updateConfiguration(runtimeConfig)
        renderExtension(runtimeConfig)
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
  initializeShowExploreCheckbox()
  initializeShowExtensionCheckbox()
  initializePreventNavigationCheckbox()
  initializeUseCookielessCheckbox()
  initializeUseDynamicHeightsCheckbox()
  initializeResetConfigButton()
}

/**
 * Render a dashboard using the Embed SDK. When active this sets up listeners
 * for events that can be sent by the Looker embedded UI.
 */
const renderDashboard = (runtimeConfig: RuntimeConfig) => {
  if (runtimeConfig.showDashboard) {
    document.querySelector<HTMLDivElement>('#demo-dashboard')!.style.display =
      ''
    LookerEmbedSDK.createDashboardWithId(runtimeConfig.dashboardId)
      // Append to the #dashboard element
      .appendTo('#dashboard')
      // Listen to messages to display progress
      .on('dashboard:loaded', () => updateStatus('#dashboard-state', 'Loaded'))
      .on('dashboard:run:start', () =>
        updateStatus('#dashboard-state', 'Running')
      )
      .on('dashboard:run:complete', () =>
        updateStatus('#dashboard-state', 'Done')
      )
      // Listen to messages that change dashboard
      .on('dashboard:edit:start', () =>
        updateStatus('#dashboard-state', 'Editing')
      )
      .on('dashboard:edit:cancel', () =>
        updateStatus('#dashboard-state', 'Editing cancelled')
      )
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
      .on('drillmenu:click', preventNavigation)
      .on('drillmodal:explore', preventNavigation)
      .on('dashboard:tile:explore', preventNavigation)
      .on('dashboard:tile:view', preventNavigation)
      // Give the embedded content a class for styling purposes
      .withClassName('looker-embed')
      // Set the initial filters
      .withFilters({ 'State / Region': 'California' })
      // Finalize the build
      .build()
      // Connect to Looker
      .connect()
      // Finish up setup
      .then(setupDashboard)
      // Log if something went wrong
      .catch((error: Error) => {
        updateStatus('#dashboard-state', 'Connection error')
        console.error('Connection error', error)
      })
  } else {
    document.querySelector<HTMLDivElement>('#dashboard')!.innerHTML = ''
    document.querySelector<HTMLDivElement>('#demo-dashboard')!.style.display =
      'none'
  }
}

/**
 * Render a look using the Embed SDK. When active this sets up listeners
 * for events that can be sent by the Looker embedded UI.
 */
const renderLook = (runtimeConfig: RuntimeConfig) => {
  // Create an embedded Look
  if (runtimeConfig.showLook) {
    document.querySelector<HTMLDivElement>('#demo-look')!.style.display = ''
    LookerEmbedSDK.createLookWithId(runtimeConfig.lookId)
      // Append to the #look element
      .appendTo('#look')
      // Listen to messages to display progress
      .on('look:ready', () => updateStatus('#look-state', 'Loaded'))
      .on('look:run:start', () => updateStatus('#look-state', 'Running'))
      .on('look:run:complete', () => updateStatus('#look-state', 'Done'))
      // Listen to messages that change Look
      .on('look:save:complete', () => updateStatus('#look-state', 'Saved'))
      .on('look:delete:complete', () => updateStatus('#look-state', 'Deleted'))
      // Give the embedded content a class for styling purposes
      .withClassName('looker-embed')
      // Set the initial filters
      .withFilters({ 'users.state': 'California' })
      // Finalize the build
      .build()
      // Connect to Looker
      .connect()
      // Finish up setup
      .then(setupLook)
      // Log if something went wrong
      .catch((error: Error) => {
        updateStatus('#look-state', 'Connection error')
        console.error('Connection error', error)
      })
  } else {
    document.querySelector<HTMLDivElement>('#look')!.innerHTML = ''
    document.querySelector<HTMLDivElement>('#demo-look')!.style.display = 'none'
  }
}

/**
 * Render an explore using the Embed SDK. When active this sets up listeners
 * for events that can be sent by the Looker embedded UI.
 */
const renderExplore = (runtimeConfig: RuntimeConfig) => {
  // Create an embedded Explore
  if (runtimeConfig.showExplore) {
    document.querySelector<HTMLDivElement>('#demo-explore')!.style.display = ''
    LookerEmbedSDK.createExploreWithId(runtimeConfig.exploreId)
      // Append to the #explore element
      .appendTo('#explore')
      // Listen to messages to display progress
      .on('explore:ready', () => updateStatus('#explore-state', 'Loaded'))
      .on('explore:run:start', () => updateStatus('#explore-state', 'Running'))
      .on('explore:run:complete', () => updateStatus('#explore-state', 'Done'))
      // Give the embedded content a class for styling purposes
      .withClassName('looker-embed')
      // Set the initial filters
      .withFilters({ 'users.state': 'California' })
      // Finalize the build
      .build()
      // Connect to Looker
      .connect()
      // Finish up setup
      .then(setupExplore)
      // Log if something went wrong
      .catch((error: Error) => {
        updateStatus('#explore-state', 'Connection error')
        console.error('Connection error', error)
      })
  } else {
    document.querySelector<HTMLDivElement>('#explore')!.innerHTML = ''
    document.querySelector<HTMLDivElement>('#demo-explore')!.style.display =
      'none'
  }
}

/**
 * Render an extension using the Embed SDK. When active this sets up listeners
 * for events that can be sent by the Looker embedded UI.
 */
const renderExtension = (runtimeConfig: RuntimeConfig) => {
  // Create an embedded extension (Requires Looker 7.12 and extension framework)
  if (runtimeConfig.showExtension) {
    document.querySelector<HTMLDivElement>('#demo-extension')!.style.display =
      ''
    LookerEmbedSDK.createExtensionWithId(runtimeConfig.extensionId)
      // Append to the #extension element
      .appendTo('#extension')
      // Give the embedded content a class for styling purposes
      .withClassName('looker-embed')
      // Finalize the build
      .build()
      // Connect to Looker
      .connect()
      // Log if something went wrong
      .catch((error: Error) => {
        updateStatus('#extension-state', 'Connection error')
        console.error('Connection error', error)
      })
  } else {
    document.querySelector<HTMLDivElement>('#extension')!.innerHTML = ''
    document.querySelector<HTMLDivElement>('#demo-extension')!.style.display =
      'none'
  }
}

/**
 * Initialize the SDK. lookerHost is the address of the Looker instance. It is configured in
 * democonfig.ts. lookerHost needs to be set for messages to be exchanged from the host
 * document to the embedded content. The auth endpoint is documented in README.md.
 */
const initializeEmbedSdk = (runtimeConfig: RuntimeConfig) => {
  if (runtimeConfig.useCookieless) {
    // Use cookieless embed
    LookerEmbedSDK.initCookieless(
      runtimeConfig.lookerHost,
      acquireEmbedSessionCallback,
      generateEmbedTokensCallback
    )
  } else {
    // Use SSO embed
    LookerEmbedSDK.init(runtimeConfig.lookerHost, '/auth')
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
  initializeEmbedSdk(runtimeConfig)
  renderDashboard(runtimeConfig)
  renderLook(runtimeConfig)
  renderExplore(runtimeConfig)
  renderExtension(runtimeConfig)
})
