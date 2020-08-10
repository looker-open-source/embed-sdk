import { LookerEmbedSDK, LookerEmbedLook, LookerEmbedDashboard } from '../src/index'

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

// IDs for content to demonstrate are configured in democonfig.ts

import { lookerHost, dashboardId, lookId, exploreId, extensionId } from './demo_config'

// Initialize the SDK. lookerHost is the address of the Looker instance. It is configured in
// democonfig.ts. lookerHost needs to be set for messages to be exchanged from the host
// document to the embedded content. The auth endpoint is documented in README.md.

LookerEmbedSDK.init(lookerHost, '/auth')

// Set up the dashboard after the SDK connects

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

  // Add a listener to the dashboard's "Stop" button and send a 'dashboard:stop' message when clicked
  const stopButton = document.querySelector('#stop-dashboard')
  if (stopButton) {
    stopButton.addEventListener('click', () => dashboard.stop())
  }

  // Add a listener to the state selector and update the dashboard filters when changed
  const stateFilter = document.querySelector('#state')
  if (stateFilter) {
    stateFilter.addEventListener('change', (event) => {
      dashboard.updateFilters({ 'State / Region': (event.target as HTMLSelectElement).value })
    })
  }
}

// Set up the look or explore after the SDK connects.

const setupLookOrExplore = (look: LookerEmbedLook) => {
  // Add a listener to the "Run All" button and send a 'look:run' message when clicked
  const runAllButton = document.querySelector('#run-all')
  if (runAllButton) {
    runAllButton.addEventListener('click', () => look.run())
  }

  // Add a listener to the state selector and update the look filters when changed
  const stateFilter = document.querySelector('#state')
  if (stateFilter) {
    stateFilter.addEventListener('change', (event) => {
      look.updateFilters({ 'users.state': (event.target as HTMLSelectElement).value })
    })
  }
}

// Handle status updates for each embedded element

const updateState = (selector: string, state: string) => {
  const stateElement = document.querySelector(selector)
  if (stateElement) {
    stateElement.textContent = state
  }
}

// A canceller callback can prevent the default behavior of links on a dashboard.
// In this instance if the click would navigate to a new window, the click is cancelled.

const canceller = (event: any) => {
  updateState('#dashboard-state', `${event.label} clicked`)
  return { cancel: !event.modal }
}

// Event listener to create embedded content. Waits until DOM is loaded so that
// all the parent elements are present.

document.addEventListener('DOMContentLoaded', function () {

  // Create an embedded dashboard
  if (dashboardId) {
    LookerEmbedSDK.createDashboardWithId(dashboardId)
      // Append to the #dashboard element
      .appendTo('#dashboard')
      // Listen to messages to display progress
      .on('dashboard:loaded', () => updateState('#dashboard-state', 'Loaded'))
      .on('dashboard:run:start', () => updateState('#dashboard-state', 'Running'))
      .on('dashboard:run:complete', () => updateState('#dashboard-state', 'Done'))
      // Listen to messages to prevent the user from navigating away
      .on('drillmenu:click', canceller)
      .on('drillmodal:explore', canceller)
      .on('dashboard:tile:explore', canceller)
      .on('dashboard:tile:view', canceller)
      // Give the embedded content a class for styling purposes
      .withClassName('looker-embed')
       // Enable Dashboards Beta
      .withNext()
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
        console.error('Connection error', error)
      })
  } else {
    document.querySelector<HTMLDivElement>('#demo-dashboard')!.style.display = 'none'
  }

  // Create an embedded Look
  if (lookId) {
    LookerEmbedSDK.createLookWithId(lookId)
      // Append to the #look element
      .appendTo('#look')
      // Listen to messages to display progress
      .on('look:ready', () => updateState('#look-state', 'Loaded'))
      .on('look:run:start', () => updateState('#look-state', 'Running'))
      .on('look:run:complete', () => updateState('#look-state', 'Done'))
      // Give the embedded content a class for styling purposes
      .withClassName('looker-embed')
      // Set the initial filters
      .withFilters({ 'users.state': 'California' })
      // Finalize the build
      .build()
      // Connect to Looker
      .connect()
      // Finish up setup
      .then(setupLookOrExplore)
      // Log if something went wrong
      .catch((error: Error) => {
        console.error('Connection error', error)
      })
  } else {
    document.querySelector<HTMLDivElement>('#demo-look')!.style.display = 'none'
  }

  // Create an embedded Explore
  if (exploreId) {
    LookerEmbedSDK.createExploreWithId(exploreId)
      // Append to the #explore element
      .appendTo('#explore')
      // Listen to messages to display progress
      .on('explore:ready', () => updateState('#explore-state', 'Loaded'))
      .on('explore:run:start', () => updateState('#explore-state', 'Running'))
      .on('explore:run:complete', () => updateState('#explore-state', 'Done'))
      // Give the embedded content a class for styling purposes
      .withClassName('looker-embed')
      // Set the initial filters
      .withFilters({ 'users.state': 'California' })
      // Finalize the build
      .build()
      // Connect to Looker
      .connect()
      // Finish up setup
      .then(setupLookOrExplore)
      // Log if something went wrong
      .catch((error: Error) => {
        console.error('Connection error', error)
      })
  } else {
    document.querySelector<HTMLDivElement>('#demo-explore')!.style.display = 'none'
  }

  // Create an embedded extension (Requires Looker 7.12 and extensions beta)
  if (extensionId) {
    LookerEmbedSDK.createExtensionWithId(extensionId)
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
        console.error('Connection error', error)
      })
  } else {
    document.querySelector<HTMLDivElement>('#demo-extension')!.style.display = 'none'
  }
})
