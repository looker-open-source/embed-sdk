/*

 MIT License

 Copyright (c) 2024 Looker Data Sciences, Inc.

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

// IDs for content to demonstrate can be configured in the .env file or in demo_config.ts

import type {
  ILookerConnection,
  ILookerEmbedSDK,
  PageChangedEvent,
  SessionStatus,
} from '../src/index'
import { getEmbedSDK } from '../src/index'
import type { RuntimeConfig } from './demo_config'
import {
  getConfiguration,
  updateConfiguration,
  loadConfiguration,
} from './demo_config'

let embedConnection: ILookerConnection
let currentPageType: string
let currentPathname: string

/**
 * Save the embed connection. This provides access to the undelying
 * functionality of each embed content type.
 */
const embedConnected = (connection: ILookerConnection) => {
  embedConnection = connection
  if (
    embedConnection.getLookerMajorVersion() >= 25 &&
    embedConnection.getLookerMinorVersion() > 10
  ) {
    updateStatus('')
  } else {
    updateStatus(
      'Listening for event "dashboard:tile:merge" is not supported by the Looker instance'
    )
  }
}

/**
 * Update the visibility of the content controls. For example
 * hide the content controls on the preload and extension pages
 * as they do not make sense.
 */
const updateContentControls = (type = 'preload') => {
  currentPageType = type
  if (
    type === 'preload' ||
    type === 'extensions' ||
    type === 'query-visualization' ||
    type === 'reporting'
  ) {
    document.getElementById('content-controls')?.classList.add('hide')
  } else {
    document.getElementById('content-controls')?.classList.remove('hide')
    if (type === 'dashboards') {
      document.getElementById('stop-embed')?.classList.remove('hide')
      document.getElementById('edit-embed')?.classList.remove('hide')
    } else {
      document.getElementById('stop-embed')?.classList.add('hide')
      document.getElementById('edit-embed')?.classList.add('hide')
    }
  }
}

/**
 * Determine the type of page the IFRAME is currently displaying
 */
const pageChanged = (event: PageChangedEvent) => {
  let pathname: string
  try {
    const url = new URL(event.page.absoluteUrl)
    pathname = url.pathname
  } catch (error) {
    pathname = '/embed/preload'
  }
  updateContentControls(pathname.split('/')[2])
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
 * A canceller callback that prevents the default behavior of edit merge query.
 * The default behavior is for the edit merge query page to be opened in a top
 * level window.
 */
const openMergeQuery = (event: any): any => {
  window.open(`/merge_edit?merge_url=${encodeURI(event.url)}`)
  updateStatus('Merge query edit opened in a new window')
  return { cancel: true }
}

/**
 * A canceller callback can prevent the default behavior of links on a dashboard.
 * In this instance, if the click will navigate to a new window, the navigation is
 * cancelled.
 */
const preventNavigation = (event: any): any => {
  const { preventNavigation } = getConfiguration()
  if (preventNavigation) {
    updateStatus(`${event.label} clicked`)
    return { cancel: !event.modal }
  }
  return {}
}

/**
 * Update embed demo type
 */
const updateEmbedType = (event: any) => {
  const runtimeConfig = getConfiguration()
  runtimeConfig.embedType = event.target.value
  updateConfiguration(runtimeConfig)
  location.reload()
}

/**
 * Initialize the embed type configuration radio buttons.
 */
const initializeEmbedTypeRadioButtons = () => {
  const signedRb = document.getElementById('useSigned') as HTMLInputElement
  const cookielessRb = document.getElementById(
    'useCookieless'
  ) as HTMLInputElement
  const privateRb = document.getElementById('usePrivate') as HTMLInputElement
  if (signedRb && cookielessRb && privateRb) {
    const { embedType } = getConfiguration()
    switch (embedType) {
      case 'cookieless':
        cookielessRb.checked = true
        break
      case 'private':
        privateRb.checked = true
        break
      default:
        signedRb.checked = true
        break
    }
    signedRb.addEventListener('change', updateEmbedType)
    cookielessRb.addEventListener('change', updateEmbedType)
    privateRb.addEventListener('change', updateEmbedType)
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
 * Clear the currently active tab
 */
const clearActiveTab = () => {
  const e = document.querySelector('.active')
  if (e) {
    e.classList.remove('active')
  }
}

/**
 * Set a tab active
 */
const setActiveTab = (e: HTMLElement) => {
  e.classList.add('active')
}

const updateActiveTab = (tabId: string) => {
  const e = document.getElementById(tabId)
  if (e) {
    clearActiveTab()
    setActiveTab(e)
  }
}

/**
 * Set a tab active
 */
const hideTab = (id: string) => {
  const e = document.getElementById(id)
  if (e) {
    e.remove()
  }
}

/**
 * Add a listener for a tab. The load function controls what
 * data will be displayed when the tab is clicked.
 */
const addTabListener = (
  id: string,
  loadFunction: () => void,
  pathname?: string
) => {
  const e = document.getElementById(id)
  if (e) {
    e.addEventListener('click', (event: Event) => {
      event.stopPropagation()
      if (embedConnection?.isEditing()) {
        updateStatus('Navigation not allowed while editing')
      } else {
        clearActiveTab()
        setActiveTab(e)
        loadFunction()
      }
    })
    if (pathname && location.pathname.startsWith(pathname)) {
      clearActiveTab()
      setActiveTab(e)
    }
  }
}

/**
 * Update the current url
 */
const updateCurrentUrl = (pathname: string, push = true) => {
  currentPathname = pathname
  const newUrl = new URL(pathname, location.origin)
  if (push) {
    history.pushState(undefined, '', newUrl)
  } else {
    history.replaceState(undefined, '', newUrl)
  }
}

/**
 * Preload tab function
 */
const preload = async () => {
  if (embedConnection) {
    await embedConnection.preload()
    updateStatus('')
    if (location.pathname !== '/' && location.pathname !== '') {
      updateCurrentUrl('/')
    }
  }
}

/**
 * Load dashboard tab function
 */
const loadDashboard1 = async () => {
  if (embedConnection) {
    const config = getConfiguration()
    if (config.dashboardId) {
      // loadDashboard falls back to legacy "dashboard:load" embed action
      await embedConnection.loadDashboard(config.dashboardId)
      if (!location.pathname.startsWith('/dashboard1')) {
        updateCurrentUrl('/dashboard1')
      }
    }
  }
}

/**
 * Load dashboard tab function
 */
const loadDashboard2 = async () => {
  if (embedConnection) {
    const config = getConfiguration()
    if (config.dashboardId2) {
      // loadDashboard falls back to legacy "dashboard:load" embed action
      await embedConnection.loadDashboard(config.dashboardId2)
      if (!location.pathname.startsWith('/dashboard2')) {
        updateCurrentUrl('/dashboard2')
      }
    }
  }
}

/**
 * Load explore tab function
 */
const loadExplore = async () => {
  if (embedConnection) {
    const config = getConfiguration()
    if (config.exploreId) {
      try {
        await embedConnection.loadExplore(config.exploreId)
        if (!location.pathname.startsWith('/explore')) {
          updateCurrentUrl('/explore')
        }
      } catch (error) {
        updateStatus(
          'Connection loadExplore functionality requires Looker version >= 25.2.0'
        )
      }
    }
  }
}

/**
 * Load look tab function
 */
const loadLook = async () => {
  if (embedConnection) {
    const config = getConfiguration()
    if (config.lookId) {
      try {
        await embedConnection.loadLook(config.lookId)
        if (!location.pathname.startsWith('/look')) {
          updateCurrentUrl('/look')
        }
      } catch (error) {
        updateStatus(
          'Connection loadLook functionality requires Looker version >= 25.2.0'
        )
      }
    }
  }
}

/**
 * Load extension tab function
 */
const loadExtension = async () => {
  if (embedConnection) {
    const config = getConfiguration()
    if (config.extensionId) {
      try {
        await embedConnection.loadExtension(config.extensionId)
        if (!location.pathname.startsWith('/extension')) {
          updateCurrentUrl('/extension')
        }
      } catch (error) {
        updateStatus(
          'Connection loadExtension functionality requires requires Looker version >= 25.2.0'
        )
      }
    }
  }
}

/**
 * Load query visualization tab function
 */
const loadQueryVisualization = async () => {
  if (embedConnection) {
    const config = getConfiguration()
    if (config.queryVisualizationId) {
      try {
        await embedConnection.loadQueryVisualization(
          config.queryVisualizationId
        )
        if (!location.pathname.startsWith('/query')) {
          updateCurrentUrl('/query')
        }
      } catch (error) {
        updateStatus(
          'Connection loadQueryVisualization functionality requires Looker version >= 25.2.0'
        )
      }
    }
  }
}

/**
 * Load query visualization tab function
 */
const loadReport = async () => {
  if (embedConnection) {
    const config = getConfiguration()
    if (config.reportId) {
      try {
        await embedConnection.loadReport(config.reportId)
        if (!location.pathname.startsWith('/report')) {
          updateCurrentUrl('/report')
        }
      } catch (error) {
        updateStatus(
          'Connection loadReport functionality requires Looker version >= 25.2.0'
        )
      }
    }
  }
}

/**
 * Initialize the tabs
 */
const initializeTabs = () => {
  addTabListener('preload-tab', preload)
  const config = getConfiguration()
  if (config.dashboardId) {
    addTabListener('dashboard-1-tab', loadDashboard1, '/dashboard1')
  } else {
    hideTab('dashboard-1-tab')
  }
  if (config.dashboardId2) {
    addTabListener('dashboard-2-tab', loadDashboard2, '/dashboard2')
  } else {
    hideTab('dashboard-2-tab')
  }
  if (config.exploreId) {
    addTabListener('explore-tab', loadExplore, '/explore')
  } else {
    hideTab('explore-tab')
  }
  if (config.lookId) {
    addTabListener('look-tab', loadLook, '/look')
  } else {
    hideTab('look-tab')
  }
  if (config.extensionId) {
    addTabListener('extension-tab', loadExtension, '/extension')
  } else {
    hideTab('extension-tab')
  }
  if (config.queryVisualizationId) {
    addTabListener('query-visualization-tab', loadQueryVisualization, '/query')
  } else {
    hideTab('query-visualization-tab')
  }
  if (config.reportId) {
    addTabListener('report-tab', loadReport, '/report')
  } else {
    hideTab('report-tab')
  }
}

/**
 * Initialize the content controls (run, stop, edit, filter)
 */
const initializeContentControls = () => {
  const runButton = document.querySelector('#run-embed')
  if (runButton) {
    runButton.addEventListener('click', () => {
      switch (currentPageType) {
        case 'dashboards':
          embedConnection.asDashboardConnection().run()
          break
        case 'explore':
          embedConnection.asExploreConnection().run()
          break
        case 'looks':
          embedConnection.asLookConnection().run()
          break
      }
    })
  }
  const stopButton = document.querySelector('#stop-embed')
  if (stopButton) {
    stopButton.addEventListener('click', () => {
      switch (currentPageType) {
        case 'dashboards':
          embedConnection.asDashboardConnection().stop()
          break
      }
    })
  }
  const editButton = document.querySelector('#edit-embed')
  if (editButton) {
    editButton.addEventListener('click', () => {
      switch (currentPageType) {
        case 'dashboards':
          embedConnection.asDashboardConnection().edit()
          break
      }
    })
  }
  const stateFilter = document.querySelector('#state-filter')
  if (stateFilter) {
    stateFilter.addEventListener('change', (event) => {
      const filter = {
        'State / Region': (event.target as HTMLSelectElement).value,
      }
      switch (currentPageType) {
        case 'dashboards':
          embedConnection.asDashboardConnection().updateFilters(filter)
          break
        case 'explore':
          embedConnection.asExploreConnection().updateFilters(filter)
          break
        case 'looks':
          embedConnection.asLookConnection().updateFilters(filter)
          break
      }
    })
  }
}

/**
 * Initialize controls.
 */
const initializeControls = () => {
  updateContentControls()
  initializePreventNavigationCheckbox()
  initializeEmbedTypeRadioButtons()
  initializeUseDynamicHeightsCheckbox()
  initializeTabs()
  initializeContentControls()
}

/**
 * Monitor cookieless embed session status. A simple implementation
 * that displays a message.
 */
const processSessionStatus = (event: SessionStatus) => {
  const { expired, interrupted } = event
  if (expired) {
    updateStatus('Session has expired')
  } else if (interrupted) {
    updateStatus('Session has been interrupted')
  }
}

/**
 * Initialize history
 */
const initializeHistoryListener = () => {
  window.addEventListener('popstate', (_event) => {
    if (currentPathname !== location.pathname && embedConnection) {
      if (
        embedConnection.isEditing() &&
        (currentPathname === '/dashboard1' ||
          currentPathname === '/dashboard2' ||
          currentPathname === '/look')
      ) {
        setTimeout(() => {
          history.forward()
        })
      } else {
        if (location.pathname.startsWith('/dashboard1')) {
          updateActiveTab('dashboard-1-tab')
          loadDashboard1()
        } else if (location.pathname.startsWith('/dashboard2')) {
          updateActiveTab('dashboard-2-tab')
          loadDashboard2()
        } else if (location.pathname.startsWith('/explore')) {
          updateActiveTab('explore-tab')
          loadExplore()
        } else if (location.pathname.startsWith('/look')) {
          updateActiveTab('look-tab')
          loadLook()
        } else if (location.pathname.startsWith('/extension')) {
          updateActiveTab('extension-tab')
          loadExtension()
        } else if (location.pathname.startsWith('/query')) {
          updateActiveTab('query-visualization-tab')
          loadQueryVisualization()
        } else if (location.pathname.startsWith('/report')) {
          updateActiveTab('report-tab')
          loadReport()
        } else {
          updateActiveTab('preload-tab')
          preload()
        }
      }
    }
  })
}

const buildInitialUrl = (runtimeConfig: RuntimeConfig) => {
  const pathname = location.pathname
  if (pathname.startsWith('/dashboard1') && runtimeConfig.dashboardId) {
    return `/embed/dashboards/${runtimeConfig.dashboardId}`
  } else if (pathname.startsWith('/dashboard2') && runtimeConfig.dashboardId2) {
    return `/embed/dashboards/${runtimeConfig.dashboardId2}`
  } else if (pathname.startsWith('/explore') && runtimeConfig.exploreId) {
    return `/embed/explore/${runtimeConfig.exploreId.replace('::', '/')}`
  } else if (pathname.startsWith('/look') && runtimeConfig.lookId) {
    return `/embed/looks/${runtimeConfig.lookId}`
  } else if (pathname.startsWith('/extension') && runtimeConfig.extensionId) {
    return `/embed/extensions/${runtimeConfig.extensionId}`
  } else if (
    pathname.startsWith('/query') &&
    runtimeConfig.queryVisualizationId
  ) {
    return `/embed/query-visualization/${runtimeConfig.queryVisualizationId}`
  } else if (pathname.startsWith('/report') && runtimeConfig.reportId) {
    return `/embed/reporting/${runtimeConfig.reportId}`
  } else {
    updateCurrentUrl('', false)
    return '/embed/preload'
  }
}

/**
 * Render the embed.
 */
const createEmbed = (runtimeConfig: RuntimeConfig, sdk: ILookerEmbedSDK) => {
  const abortController = new AbortController()
  const signal = abortController.signal
  let timeoutId: any = setTimeout(() => {
    abortController.abort(
      `Connection attempt timed out. Please check that ${location.origin} has been allow listed`
    )
    timeoutId = undefined
  }, 60000)
  sdk
    .createWithUrl(buildInitialUrl(runtimeConfig))
    // When true scrolls the top of the IFRAME into view
    .withDialogScroll(runtimeConfig.useDynamicHeights)
    // When true updates the IFRAME height to reflect the height of the
    // dashboard
    .withDynamicIFrameHeight(runtimeConfig.useDynamicHeights)
    // When true monitors the scroll position of the hosting window
    // and sends it to the Looker IFRAME. The Looker IFRAME uses the
    // information to position dialogs correctly.
    .withScrollMonitor(runtimeConfig.useDynamicHeights)
    // Allow fullscreen tile visualizations
    .withAllowAttr('fullscreen')
    // Applicable to private embed only. If the user is not logged in,
    // the Looker login page will be displayed. Note that this will not
    // in Looker core.
    .withAllowLoginScreen()
    // Append to the #dashboard element
    .appendTo('#embed-container')
    .on('page:changed', (event: PageChangedEvent) => {
      pageChanged(event)
    })
    // Listen to messages to display dashboard progress
    .on('dashboard:loaded', () => updateStatus('Loaded'))
    .on('dashboard:run:start', () => updateStatus('Running'))
    .on('dashboard:run:complete', () => updateStatus('Done'))
    // Listen to messages that change dashboard
    .on('dashboard:edit:start', () => updateStatus('Editing'))
    .on('dashboard:edit:cancel', () => updateStatus('Editing cancelled'))
    .on('dashboard:save:complete', () => updateStatus('Saved'))
    .on('dashboard:delete:complete', () => updateStatus('Deleted'))
    .on('session:status', (event: SessionStatus) => {
      processSessionStatus(event)
    })
    // Listen to messages to prevent the user from navigating away
    .on('drillmenu:click', preventNavigation)
    .on('drillmodal:explore', preventNavigation)
    .on('dashboard:tile:explore', preventNavigation)
    .on('dashboard:tile:view', preventNavigation)
    // Open merge query in its own window
    .on('dashboard:tile:merge', openMergeQuery)
    // Listen to messages to display explore progress
    .on('explore:ready', () => updateStatus('Loaded'))
    .on('explore:run:start', () => updateStatus('Running'))
    .on('explore:run:complete', () => updateStatus('Done'))
    // Listen to messages to display look progress
    .on('look:ready', () => updateStatus('Loaded'))
    .on('look:run:start', () => updateStatus('Running'))
    .on('look:run:complete', () => updateStatus('Done'))
    // Listen to messages that change Look
    .on('look:edit:start', () => updateStatus('Editing'))
    .on('look:edit:cancel', () => updateStatus('Editing cancelled'))
    .on('look:save:complete', () => updateStatus('Saved'))
    .on('look:delete:complete', () => updateStatus('Deleted'))
    // Session expired
    .on('session:expired', () => updateStatus('Session Expired'))
    // Give the embedded content a class for styling purposes
    .withClassName('looker-embed')
    // Set the initial filters
    .withFilters({ 'State / Region': 'California' })
    // Finalize the build
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
  createEmbed(runtimeConfig, sdk)
}

/**
 * Event listener to create embedded content. Waits until DOM is loaded so that
 * all the parent elements are present.
 */
document.addEventListener('DOMContentLoaded', function () {
  loadConfiguration()
  initializeHistoryListener()
  initializeControls()
  const runtimeConfig = getConfiguration()
  initializeEmbedSdk(runtimeConfig)
})
