# Looker JavaScript Embed SDK

## Embed SDK version 2.0.0

The following document has been updated to reflect the implementation of Embed SDK 2.0.0. Technically the 2.0.0 API is backwards compatible with Embed SDK 1.8.x but the underlying implementation has changed for some functionality. SDK 1.8.x exported a number of classes. SDK 2.0.0 replaces these classes with deprecated interfaces. It is preferred that application that uses the SDK use the 'I' prefixed interfaces (which are identical to the non prefixed interfaces). Applications upgrading to SDK 2.0.0 should behave the same. In order to take advantage of the API improvements some refactoring will be required.

## Introduction

The Looker JavaScript Embed SDK is designed to facilitate using Looker embedded content in your web application. The goal is to make communication between a host website and one or more embedded dashboards, looks, explores and extensions easier and more reliable.

The Looker JavaScript Embed SDK typically uses embed SSO to sign an embed url in order to authenticate the user of the embed. This mechanism relies on Looker cookies being available to the embedded IFRAME in order for the application to work. Looker also provides a mechanism that allows embedded Looker IFRAMES to work without the need for cookies. Details can be found [here](#cookieless).

A typical setup might look like this. In this case, a dashboard with an id of `11` is created inside a DOM element with the id `dashboard`. The `dashboard:run:start` and `dashboard:run:complete` events are used to update the state of the embedding window's UI, and a button with an id of `run` is scripted to send a `dashboard:run` message to the dashboard.

```javascript
getEmbedSDK().init('looker.example.com', '/auth')

const setupDashboard = (connection) => {
  document.querySelector('#run').addEventListener('click', () => {
    connection.asDashboardConnection().run()
  })
}

try {
  connection = await getEmbedSDK()
    .createDashboardWithId(11)
    .appendTo('#embed_container')
    .on('dashboard:run:start', () => updateStatus('Running'))
    .on('dashboard:run:complete', () => updateStatus('Done'))
    .build()
    .connect()
  setupDashboard(connection)
} catch (error) {
  console.error('An unexpected error occurred', error)
}
```

A more complete example can be found [here](demo/demo_single_frame.ts) and [here](demo/demo_multi_frame.ts). Detailed instructions on how to use the SDK can be found [here](#demo).

## Details

The Looker Embed SDK uses a fluent interface pattern. The construction of the embedded content is broken into two phases, building and connecting.

### Building

First initialize the SDK with address of the Looker server and the endpoint of the embedding application server that will create a signed Looker embedded login URL.

```javascript
getEmbedSDK().init('looker.example.com', '/auth')
```

In this example, `/auth` is a backend service that must be implemented as described in the [Auth](#the-auth-endpoint) section.

After the SDK is initialized, begin by creating the builder with an `id`. For example, to create a dashboard embed builder:

```javascript
getEmbedSDK().createDashboardWithId(id)
```

You can then add additional attributes to the builder to complete your setup:

```javascript
  .appendTo('#dashboard')
```

You can add event handlers:

```javascript
  .on('dashboard:run:start',
      () => updateStatus('Running')
  )
  .on('dashboard:run:complete',
      () => updateStatus('Done')
  )
```

You finish by building the embedded element:

```javascript
  .build()
```

The `create[Type]` functions (`Id` and `URL` ) will call your backend `/auth` endpoint when `build` is invoked and requires a signed embed URL in response.

If you want to send and receive messages to the embedded IFRAME you need to call `connect()` which returns a Promise that resolves to the communication interface of the given embedded IFRAME (the connection):

```javascript
  .connect()
  .then(setupConnection)
  .catch(console.error)
```

Embed SDK 2.0.x allows the same IFRAME to be used for all Looker embed types. Once the connection has been established, use the `load[Type]` methods on the connection to load different Looker embed object instances or types.

## Building URLs for the SDK

_The Embed SDK 2.0.0 now allows URL building for cookieless embed._

The main documentation for Looker SSO embed URLs is [here](https://docs.looker.com/r/sdk/sso-embed).

Embed SDK 2.0.0 will sanitize the URL if necessary:

1. It will strip hostname and protocol if present.
2. It will prefix the URL with `/embed` if missing.
3. It will add the `sdk` parameter if missing.
4. It will add the `embed_domain` parameter if missing.
5. It will throw an error if the URL is invalid.

```html
/embed/looks/4?embed_domain=https://mywebsite.com =>
/embed/looks/4?embed_domain=https://mywebsite.com&sdk=3
```

## Signed URL Auth Endpoint

This section does not apply to cookieless embed. See the [cookieless embed](#cookieless) section for details.

In order to use the embed SDK on the frontend you must supply a backend service that handles authentication. This service is called by the SDK to generate a signed iframe URL that is unique to the requesting user. The backend process can either generate the signed embed URL itself using an embed secret or the backend process can generate the URL by calling the [Looker Create Signed Embed URL API](https://cloud.google.com/looker/docs/reference/looker-api/latest/methods/Auth/create_sso_embed_url). Manual URL generation and signing avoids calling the Looker API resulting in decreased latency. Calling the Looker API requires less code and can be easier to maintain.

### Signed URL Backend Process

This section does not apply to cookieless embed. See the [cookieless embed](#cookieless) section for details.

The _backend_ process entails hosting a service at an endpoint such as `/auth` which does the following:

1. Appends information about the embed user to the URL.

2. Signs the URL using either an embed secret obtained from the Looker instance OR by calling the [Create Signed Embed URL API](https://cloud.google.com/looker/docs/reference/looker-api/latest/methods/Auth/create_sso_embed_url).

3.

### Signed URL Frontend Process

This section does not apply to cookieless embed. See the [cookieless embed](#cookieless) section for details.

The _frontend_ process using the Embed SDK entails:

1. The embed SDK is initialized with the Looker host and the backend embed login signing endpoint:

```javascript
getEmbedSDK().init('looker.example.com', '/auth')
```

2. Build the embed definition

```javascript
const builder = getEmbedSDK()
  .createDashboardWithId(11)
  .append('#embed-container')
  .build()
```

3. Create the IFRAME

```javascript
const connection = await builder.connect()
```

The call to connect calls the auth endpoint to get a signed embed login URL. This URL is used to construct the IFRAME. The conection returned from the call allows the hosting application to interact with the Looker IFRAME. Embed SDK 2.0.x has a single connection object that can interact will Looker embed object types (dashboards, explores, looks, extensions). This means that it is no longer a requirement to replace an existing IFRAME with another IFRAME to display a different object type or object type instance.

If another IFRAME is required, the SDK will not call the auth endpoint again as the embed session already exists. Instead the IFRAME will be created with the requested embed URL without signing a `login/embed` URL. If multiple IFRAMEs are created on page load (not recommended but it does work), the SDK will wait for the first IFRAME to be created before creating the more IFRAMEs. This is done to reduce contention that can occur when complex embed users are created.

4. Load a different object type.

```javascript
await connection.loadLook('42')

await connection.loadUrl('/embed/dashboards/84?state=California')
```

Different looker object types or object type instances can be loaded without recreating the IFRAME.

### Signed URL Advanced Auth Configuration

This section does not apply to cookieless embed. See the [cookieless embed](#cookieless) section for details.

The Auth endpoint can be configured further, allowing custom Request Headers, as well as CORS support by passing an options object to the `init` method

```javascript
getEmbedSDK().init('looker.example.com', {
  url: 'https://api.acme.com/looker/auth',
  headers: [{ name: 'Foo Header', value: 'Foo' }],
  params: [{ name: 'foo', value: 'bar' }],
  withCredentials: true, // Needed for CORS requests to Auth endpoint include Http Only cookie headers
})
```

### Node helper

This section does not apply to cookieless embed. See the [cookieless embed](#cookieless) section for details.

If you prefer, your backend service can [implement the signature function](https://github.com/looker/looker_embed_sso_examples) instead of calling the Looker API by using a [Looker Embed secret](https://docs.looker.com/r/sdk/sso-embed). Manually generating the signed URL avoids a call to the Looker API but is more error prone.

One example of a helper method that generates a signed URL, `createSignedUrl()`, is provided in
[server_utils/auth_utils.ts](blob/master/demo/demo_config.ts). Its usage is as follows:

```javascript
import { createSignedUrl } from './auth_utils'

app.get('/looker_auth', function (req, res) {
  // The request should be authorized
  const src = req.query.src
  const host = 'looker.example.com'
  const secret = YOUR_EMBED_SECRET
  const user = authenticatedUser
  const url = createSignedUrl(src, user, host, secret)
  res.json({ url })
})
```

The `user` data structure is

```typescript
interface LookerEmbedUser {
  external_user_id: string
  first_name?: string
  last_name?: string
  session_length: number
  force_logout_login?: boolean
  permissions: LookerUserPermission[]
  models: string[]
  group_ids?: number[]
  external_group_id?: string
  user_attributes?: { [key: string]: any }
  access_filters: { [key: string]: any }
}
```

<a name='cookieless' id='cookieless'></a>

## Cookieless Embed

_Cookieless embed in Embed SDK 2.0.0 now supports the use of `withUrl`._

Looker cookieless embed allows the Looker application to be embedded by an html page that is served from a different domain than the Looker host. With signed URL embed, to avoid third party cookie blocking, the Looker application must be served from a sub domain of the hosting application OR the user must enable third party cookies in the browser. Enabling cookieless embedding is documented in more detail [here](https://cloud.google.com/looker/docs/r/sdk/cookieless-embed). Cookieless embed is available with Looker version 22.20 and above.

Cookieless embed works by using short lived tokens that are kept in the browser and are used to reference the actual session in the Looker server. The Looker UI keeps track of the tokens, and before they expire, requests that the hosting application generate new ones. To this end, the host application is required to implement functionality in the client and in the server.

This functionality will:

- Acquire a new session either by creating or attaching to an existing session associated with the browser (this allows the user to create new IFRAMEs and use the same session).
- Generate new tokens.

### Acquire session backend process

This process will be called every time a Looker embed IFRAME is created. The acquire session backend process requires that the Looker api endpoint `acquire_embed_cookieless_session` be called to create an embed session or attach to an existing embed session. This endpoint accepts an embed user definition and creates or updates it. This is similar behavior to the signed URL embed login as they both can create and update embed user data.
One major difference in the payloads is that `force_logout_login` is ignored by `acquire_embed_cookieless_session`. Cookieless embed logins ALWAYS force logout login (as there should be no Looker cookies this should be a noop).

Cookieless embed sessions are associated with the user's browser user agent. It is important that that user agent for the browser be set on the request.

If successful, the `acquire_embed_cookieless_session` returns a number of tokens:

- `session_reference_token` - this token is used to generate new tokens and created new IFRAMEs. It is important to secure and keep track of this token. It should not be returned to the browser. This token lives for the duration of the session. A new cookieless embed session will need to be created when the `session_reference_token` expires.
- `authentication_token` - this is one time token that has a lifespan of 30 seconds. It is used with the `/login/embed/{target}` endpoint.
- `navigation_token` - this token is used to navigate to different Looker pages in the Looker application. This token lives for 10 minutes.
- `api_token` - this token is used for api calls. This token lives for 10 minutes.

A time to live for each token is also returned. It is important that the response of the `acquire_embed_cookieless_session` be returned to the browser with the exception of the `session_reference_token`. The hosting application MUST keep track of the `session_reference_token` for each user.

The example shown below is simplistic and uses an in memory cache to keep track of the `session_reference_token`. In memory caches will not work in clustered environments so use a distributed cache such as `redis` in production. An alternative is to save the `session_reference_token` in an encrypted session cookie. The use of session cookies is demonstrated [here](/server_utils/routes.ts).

```javascript
// Simple endpoint to acquire an embed session. In this case the user data
// comes from a configuration file. In a real life application the user data
// would be derived from the embedding hosts session.
app.get('/acquire-embed-session', async function (req, res) {
  try {
    const tokens = await acquireEmbedSession(req.headers['user-agent'], user)
    res.json(tokens)
  } catch (err) {
    res.status(400).send({ message: err.message })
  }
})

// The Looker session. In a real application this should not be a global variable,
let lookerSession

// A very simple cache for storing embed sessions. In a real life application the
// embed session should be associated with the embedding application user's session.
const embedSessions = {}

// Simple function to acquire a looker session and then acquire an embed
// session.
async function acquireEmbedSession(userAgent, user) {
  await acquireLookerSession()
  return acquireEmbedSessionInternal(userAgent, user)
}

// Simple function to acquire a Looker API session.
const acquireLookerSession = async () => {
  if (!lookerSession || !lookerSession.activeToken.isActive()) {
    const { api_url, client_id, client_secret, verify_ssl } = config
    try {
      const lookerSettings = DefaultSettings()
      lookerSettings.readConfig = () => {
        return {
          client_id,
          client_secret,
        }
      }
      lookerSettings.base_url = api_url
      lookerSettings.verify_ssl = verify_ssl
      lookerSession = new NodeSession(lookerSettings)
      lookerSession.login()
    } catch (error) {
      console.error('login failed', { error })
      throw error
    }
  }
}

// Simple function to acquire the embed session.
// Note as an additional layer of security the user agent of users
// browser is associated with the embed session. It is important
// that this is available when the embed session is created.
const acquireEmbedSessionInternal = async (userAgent, user) => {
  try {
    const cacheKey = `${user.external_user_id}/${userAgent}`
    const embedSession = embedSessions[cacheKey]
    const request = {
      ...user,
      session_reference_token: embedSession?.session_reference_token,
    }
    const sdk = new Looker40SDK(lookerSession)
    const response = await sdk.ok(
      sdk.acquire_embed_cookieless_session(request, {
        headers: {
          'User-Agent': userAgent,
        },
      })
    )
    // Note the cachekey includes the embed user id and user agent.
    // This allows the embed user to use different browsers at the
    // same time. Note that a cache is not the only way to save the
    // embed session information, the hosting applications user session
    // can also be used (and probably should be).
    embedSessions[cacheKey] = response
    const {
      authentication_token,
      authentication_token_ttl,
      navigation_token,
      navigation_token_ttl,
      session_reference_token_ttl,
      api_token,
      api_token_ttl,
    } = response
    // Important. Do not return the entire response to the client! The response
    // contains the session_reference_token. This token MUST be kept secure.
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
    console.error('embed session acquire failed', { error })
    throw error
  }
}
```

### Generate tokens backend process

This process is called whenever tokens are about to expire and can be called after a token has expired (for example, a user waking up computer that has gone to sleep). The generate tokens backend process requires that the Looker api endpoint `generate_tokens_for_cookieless_session` be called to generate new navigation and api tokens.

Cookieless embed sessions are associated with the user's browser user agent. It is important that that user agent for the browser be included in the request.

This is very simplistic implementation for demonstration purposes only. An actual implementation should be a lot more robust. If the embed session has expired,
the `session_reference_token_ttl` value will be set to 0. When this happens, embedded IFRAMEs can no longer be used and are locked from further interaction.

```javascript
app.get('/generate-embed-tokens', async function (req, res) {
  try {
    const tokens = await generateEmbedTokens(req.headers['user-agent'], user)
    res.json(tokens)
  } catch (err) {
    res.status(400).send({ message: err.message })
  }
})

export async function generateEmbedTokens(userAgent, user) {
  const cacheKey = `${user.external_user_id}/${userAgent}`
  const embedSession = embedSessions[cacheKey]
  if (!embedSession) {
    console.error(
      'embed session generate tokens failed, session not yet acquired'
    )
    throw new Error(
      'embed session generate tokens failed, session not yet acquired'
    )
  }
  await acquireLookerSession()
  try {
    const { api_token, navigation_token, session_reference_token } =
      embedSession
    const sdk = new Looker40SDK(lookerSession)
    const response = await sdk.ok(
      sdk.generate_tokens_for_cookieless_session(
        {
          api_token,
          navigation_token,
          session_reference_token: session_reference_token || '',
        },
        {
          headers: {
            'User-Agent': userAgent,
          },
        }
      )
    )
    const cacheKey = `${user.external_user_id}/${userAgent}`
    embedSessions[cacheKey] = response
    return {
      api_token: response.api_token,
      api_token_ttl: response.api_token_ttl,
      navigation_token: response.navigation_token,
      navigation_token_ttl: response.navigation_token_ttl,
      session_reference_token_ttl: response.session_reference_token_ttl,
    }
  } catch (error) {
    console.error('embed session generate tokens failed', { error })
    throw error
  }
}
```

### Initializing the Looker SDK in the frontend

Cookieless embed is initialized by calling `getEmbedSDK().initCookieless` passing in the Looker host value and the the urls of the backend endpoints described previously. Once a Looker embed IFRAME is created it will communicate with the Embed SDK running in the host application and use the callbacks appropriately.

```javascript
getEmbedSDK().initCookieless(
  'looker.example.com',
  '/acquire-embed-session',
  '/generate-embed-tokens'
)
```

### Embed domain allow list

Looker embed SSO requires that the host application domain be added to an allow list using the Looker configure admin page. Starting with Looker version `23.8`, the embed domain can be specified in the payload of the `acquire_embed_cookieless_session` call. This allows customers to dynamically specify the allowed domains. The allowed domain is associated with the embed session stored in the Looker server and is NOT persisted to the internal Looker database. This means that the embed domain must be included with every `acquire_embed_cookieless_session` call.

When implementing it is HIGHLY recommended that that the implementor NOT trust any embed domain sent from the browser (in other words do not use the location.origin from the browser). Instead, the embed application should implement a mechanism in the server that maps a user to particular domain.

To add the embed domain to the `acquire_embed_cookieless_session` payload set the `LOOKER_USE_EMBED_DOMAIN` variable to true in the `.env` file

## Demonstration Application

The `./demo` directory contains the frontend code for an embedded application. The following features can demonstrated:

1. Signed URL embedding using a single IFRAME. Multiple Looker object types and instances can be loaded using a single IFRAME.
2. Signed URL embedding using multiple IFRAMES. An IFRAME can be created for a dashboard, look, explore and/extension.
3. Cookieless embedding using a single IFRAME. Multiple Looker object types and instances can be loaded using a single IFRAME.
4. Cookieless embedding using multiple IFRAMES. An IFRAME can be created for a dashboard, look, explore and/extension.
5. Embed Message API embedding (this is provided for information purposes only and demonstrates how to embed Looker without using the Embed SDK).

### Step 1 - Enable Embedding in your Looker instance

Enabling signed URL embedding is documented in more detail [here](https://cloud.google.com/looker/docs/single-sign-on-embedding).
Enabling cookieless embedding is documented in more detail [here](https://cloud.google.com/looker/docs/r/sdk/cookieless-embed).

- Navigate to Admin > _Platform_ Embed on your Looker instance. This requires Admin privileges.
- The demo server runs by default at [http://localhost:8080](http://localhost:8080). By adding that address to "Embedded Domain Whitelist" you can enabled the demo to receive messages from Looker.
- Turn on "Embed SSO Authentication"
- In order to use embedding you must generate an "Embed Secret" for SSO embedding and/or a JWT secret for cookieless embedding. A Looker instance can support signed URL and cookieles embedding simulaneously.

Additional steps to activate cookieless embed:

- Navigate to `Admin > Platform > Embed` on your Looker instance. This requires Admin privileges.
- Enable Cookieless Embed.
- Generate an Embed JWT secret. This is used internally and the hosting application does not need to know what it is.

### Step 2 - Customize the Demo settings for your Looker instance

Configure the TypeScript demo server.

- Embed secret configuration:

  - Set it as `LOOKER_EMBED_SECRET` in your shell environment.
  - Create a file named `.env` in the root of the sdk directory. Add a line to that file: `LOOKER_EMBED_SECRET="YourLookerSecret"`

- Looker instance host address configuration:

  - Create a `.env` file in the main embed-sdk directory and add `LOOKER_WEB_URL="yourinstance.looker.com:yourport"`

- Edit the `demo/demo_config.ts` file to be appropriate for the pages you want to embed. It is also possible to override the `demo/demo_config.ts` in the `.env` file. See [here](#env) for more details.

```javascript
// The address of your Looker instance. Required.
// Include the port if it is necessary when accessing looker in a browser
// Do NOT include the protocol
const lookerHost = 'mycompany.looker.com'

// A dashboard that the user can see. Set to '-' or '0' to disable dashboard demo.
// dashboardId can be a numeric id or a slug string.
const dashboardId = '1'

// A Look that the user can see. Set to '-' or '0' to disable look demo.
// lookId must be numeric. Slugs are NOT supported.
const lookId = '1'

// An Explore that the user can see. Set to '-' to disable explore demo.
const exploreId = 'thelook::orders'

// An Extension that the user can see. Set to '-' to disable extension demo.
// Requires Looker 7.12 and extensions framework.
const extensionId = 'extension::my-great-extension'
```

- Edit the `demo/demo_user.json` file to be appropriate for the type of user you want to embed. Normally your backend service would use information about the user logged into your embedding application to inform Looker about important user properties that control data access controls. The `demo/demo_user.json` file is also used for cookieless embedding. Remember that cookieless_embed always treast `force_logout_login` as `true`. See [documentation](https://cloud.google.com/looker/docs/single-sign-on-embedding) for detailed information on the content of the embed user definition.

```javascript
{
  // External embed user ID. IDs are not shared with regular users. Required
  "external_user_id": "user1",
  // First and last name. Optional
  "first_name": "Pat",
  "last_name": "Embed",
  // Duration before session expires, in seconds. Required.
  "session_length": 3600,
  // Enforce logging in with these permissions. Recommended.
  "force_logout_login": true,
  // External embed group ID. Optional.
  "external_group_id": "group1",
  // Looker Group IDs. Optional
  "group_ids": [],
  // Permissions. See documentation for details. Required.
  // Can any combination of:
  //   'access_data'
  //   'see_lookml_dashboards'
  //   'see_looks'
  //   'see_user_dashboards'
  //   'explore'
  //   'create_table_calculations'
  //   'create_custom_fields'
  //   'can_create_forecast'
  //   'save_content'
  //   'send_outgoing_webhook'
  //   'send_to_s3'
  //   'send_to_sftp'
  //   'schedule_look_emails'
  //   'schedule_external_look_emails'
  //   'send_to_integration'
  //   'create_alerts'
  //   'download_with_limit'
  //   'download_without_limit'
  //   'see_sql'
  //   'clear_cache_refresh'
  //   'see_drill_overlay'
  //   'embed_browse_spaces'
  //   'embed_save_shared_space'
  "permissions": [
    "access_data",
    "see_looks",
    "see_user_dashboards",
    "explore"
    "save_content",
    "embed_browse_spaces"
  ],
  // Model access permissions. Required.
  "models": ["powered_by", "thelook"],
  // User attributes. Optional.
  "user_attributes": { "locale": "en_US" },
  // Access filters. Optional.
  "access_filters": { "powered_by": { "products.brand": "Allegra K" } }
}
```

### Step 3 - Build and run the demo

Run the following commands from the top-level embed-sdk directory.

- `npm install`
- `npm run server`
- The server will listen on port 8080.

### Logging

The Embed SDK is built on top of [chatty](https://github.com/looker-open-source/chatty). Chatty uses [debug](https://github.com/visionmedia/debug) for logging. You can enable logging
in a browser console with

```javascript
localStorage.debug = 'looker:chatty:*'
```

The hosting window and the embedded IFRAME have separate local storage, so you can enable logging on one, the other or both. You can disable logging with

```javascript
localStorage.debug = undefined
```

### <a name='env' id='env'></a> `.env` setup

The embed demo environment can be configured using a `.env` file. The following is a template that can be used to create the file (in the root of this repo). The `.env` file should never be stored in your git repo and is included in the repo's `.ignore` file.

```shell
LOOKER_WEB_URL=mycompany.looker.com
LOOKER_API_URL=https://mycompany.looker.com:19999
LOOKER_DEMO_HOST=localhost
LOOKER_DEMO_PORT=8080
LOOKER_EMBED_SECRET=
LOOKER_CLIENT_ID=
LOOKER_CLIENT_SECRET=
LOOKER_DASHBOARD_ID=1
LOOKER_DASHBOARD_ID_2=2
LOOKER_LOOK_ID=1
LOOKER_EXPLORE_ID=thelook::orders
LOOKER_EXTENSION_ID=extension::my-great-extension
COOKIE_SECRET=cookie_stash
LOOKER_USE_EMBED_DOMAIN=false
```

## Embedded Javascript Events

Prior to the release of the Embed SDK, Looker exposed an API that utilized JavaScript `postMessage` events. This API is still available for customers who cannot or do not want to use the Embed SDK (using the Embed SDK is highly recommended as it provides additional functionality and is simpler to use). An example application has been created to ensure that cookieless embed also works with JavaScript `postMessage` events. This example can be found [here](demo/message_example.ts).

## Additional Considerations

## Dynamic dashboard height

The IFRAMEs containing dashboards can be resized to reflect the height of the embedded dashboard. This allows the IFRAME to own the scrollbar rather than the embedded dashboard. To implement dynamic dashboard heights, listen to `page:properties:changed` events and use the height to set the IFRAME height. Example:

```javascript
const pagePropertiesChangedHandler = (
  { height }: PagePropertiesChangedEvent,
  elementId: string
) => {
  if (height && height > 100) {
    const element = document.querySelector(
      `#${elementId} iframe`
    ) as HTMLIFrameElement
    if (element) {
      element.style.height = `${height}px`
    }
  }
}


getEmbedSDK().createDashboardWithId(runtimeConfig.dashboardId)
  .appendTo('#dashboard')
  .on('page:properties:changed', (event: PagePropertiesChangedEvent) => {
    pagePropertiesChangedHandler(event, 'dashboard')
  })
  .build()
  .connect()
```

The Embed SDK also contains a convenience method to add this functionality for you. Example:

```javascript
getEmbedSDK()
  .createDashboardWithId('42')
  .withDynamicIFrameHeight()
  .appendTo('#dashboard')
  .build()
  .connect()
```

### Full screen tile visualizations

Looker has the capability to display individual tile visualizations in full screen mode. This feature works for embedded IFRAMEs but the `fullscreen` feature MUST be added to the containing IFRAME. Version 1.8.2 of the Embed SDK was updated to allow features to be added. The following example shows how to enable support for full screen mode.

```javascript
const connection = await getEmbedSDK()
  .createDashboardWithId(runtimeConfig.dashboardId)
  // Allow fullscreen tile visualizations
  .withAllowAttr('fullscreen')
  // Append to the #dashboard element
  .appendTo('#dashboard')
  // Finalize the build
  .build()
  // Connect to Looker
  .connect()
```

### Tile dialogs

Users have the capability of opening dialogs from a dashboard tile. One downside of opening the dialogs is that unexpected scrolling can occur. With Looker 23.6+ it is now possible to mitigate the scrolling using the Embed SDK. Example:

```javascript
const connection = await getEmbedSDK()
  .createDashboardWithId(runtimeConfig.dashboardId)
  // Scrolls the top of the IFRAME into view when drilling
  .withDialogScroll()
  // Ensures that the tile download and tile alert dialogs remain in view
  .withScrollMonitor()
  // Append to the #dashboard element
  .appendTo('#dashboard')
  // Finalize the build
  .build()
  // Connect to Looker
  .connect()
```

This functionality is also available to the javascript API. See [here](demo/message_example.ts) for how to add this functionality.
