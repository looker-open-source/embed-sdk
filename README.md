# Looker JavaScript Embed SDK

## Embed SDK version 2.0.0

The following document has been updated to reflect the creation of Embed SDK 2.0.0. Technically the 2.0.0 API is backwards compatible with Embed SDK 1.8.x but the underlying implementation has changed for some functionality. SDK 1.8.x exported a number of classes. SDK 2.0.0 replaces these classes with interfaces that are marked as deprecated (alternative interfaces are identified). It is preferred that applications use the 'I' prefixed interfaces (which are identical to the non prefixed interfaces). Applications upgrading to SDK 2.0.0 should behave the same. In order to take advantage of the API improvements some refactoring will be required.

The major changes included in Embed SDK 2.0.0 are:

1. Navigating between Dashboards, Explores and Looks no longer requires the recreation of an IFRAME. Instead the `loadDashboard`, `loadLook`, `loadExplore` and `loadUrl` methods can be used to navigate within the Looker IFRAME.
2. `connect` now returns a unified connection rather than a connection related to a Dashboard, Look or Explore. The unified connection allows embedding applications to be aware of the user navigating inside of the IFRAME.
3. Support for additional Looker embedded content has been added:
   - Reports.
   - Query Visualizations.

## Introduction

The Looker JavaScript Embed SDK is designed to facilitate using Looker embedded content in a web application. The goal is to make communication between a host website and one or more embedded Dashboards, Looks, Explores, Reports and Extensions easier and more reliable.

The Looker JavaScript Embed SDK typically uses embed SSO to sign an embed url in order to authenticate the user of the embedded content. This mechanism relies on Looker cookies being available to the embedded IFRAME in order for the application to work. It is recommended that customers use vanity domains where the embedded server and the Looker server run on the same domain but different subdomains. By doing this third party cookie blocking is mitigated (as the cookies are no longer third party). Alternatively Looker provides a mechanism that allows embedded Looker IFRAMEs to work without the need for cookies. Details can be found [here](#cookieless).

A typical setup might look like this. In this case, a dashboard with an id of `11` is created inside a DOM element with the id `embed_container`. The `dashboard:run:start` and `dashboard:run:complete` events are used to update the state of the embedding window's UI, and a button with an id of `run` is scripted to send a `dashboard:run` message to the dashboard.

```javascript
getEmbedSDK().init('looker.example.com', '/auth')

const setupConnection = (connection) => {
  document.querySelector('#run').addEventListener('click', () => {
    connection.asDashboardConnection().run()
  })
}

try {
  connection = await getEmbedSDK()
    .createDashboardWithId('11')
    .appendTo('#embed_container')
    .on('dashboard:run:start', () => updateStatus('Running'))
    .on('dashboard:run:complete', () => updateStatus('Done'))
    .build()
    .connect()
  setupConnection(connection)
} catch (error) {
  console.error('An unexpected error occurred', error)
}
```

A more complete example can be found [here](https://github.com/looker-open-source/embed-sdk/blob/master/demo/demo_single_frame.ts) and [here](https://github.com/looker-open-source/embed-sdk/blob/master/demo/demo_multi_frame.ts).

## Details

The Looker Embed SDK uses the fluent interface pattern. The construction of the embedded content is broken into two phases, building and connecting. The hosting application may interact with the embedded content once the connection is established.

### Building

Initialize the SDK with the address of the Looker server and the endpoint of the embedding application server that will create a signed Looker embedded login URL (for private embedding, omit the signing endpoint).

```javascript
getEmbedSDK().init('looker.example.com', '/auth')
```

In this example, `/auth` is a backend service that must be implemented as described in the [Signed URL Auth Endpoint](#the-auth-endpoint) section.

After the SDK is initialized, create the builder using an `id` or `URL`. For example, to create a Dashboard embed builder do one of the following:

```javascript
getEmbedSDK().createDashboardWithId('42')
// OR
getEmbedSDK().createDashboardWithUrl('/embed/dashboards/42?state=california')
```

The `create[ContentType]WithUrl` functions can used with both signed and cookieless embed starting with Embed SDK 2.0.0. Prior to Embed SDK 2.0.0, Cookieless Embed only supported `create[CotentType]WithId`.

Additional attributes can be added to the builder to complete the setup:

```javascript
  .appendTo('#dashboard')
```

Event handlers can be added:

```javascript
  .on('dashboard:run:start',
      () => updateStatus('Running')
  )
  .on('dashboard:run:complete',
      () => updateStatus('Done')
  )
```

Create an embedded client by calling the build method:

```javascript
  .build()
```

### Connecting

Once the client is built, call `connect` to create the IFRAME. The connect process creates the `src` attribute used for the actual IFRAME. How the `src` value is generated is based upon how the embed SDK is initialized.

1. Signed - the endpoint specified by the 2nd argument of the `init` call is called. The endpoint is expected to return a signed embed login URL.
2. Cookieless - the endpoint or the function specified by the 2nd argument of the `initCookieless` call is called. The endpoint or function is expected to return cookieless tokens, in particular the authentication and navigation tokens. The tokens are appended to the embed login URL.
3. Private - the embed connection is private if the 2nd argument of the `init` call is not provided. In this case the URL is derived from the builder and decorated with the parameters required for Looker embed. For private embed, it is expected that the user is already logged into Looker OR that embedding URL include the `allow_login_screen=true` parameter.

`connect` returns a Promise that resolves to the connection interface for the embedded IFRAME.

```javascript
  .connect()
  .then((connection) => {
    // Save the connection
  })
  .catch(console.error)
```

### Interacting

Embed SDK 2.0.0 returns a unified connection that supports interacting with all Looker content types. The Embedding application can determine what kind of content is currently being displayed and interact accordingly.

```javascript
if (connection.getPageType() === 'dashboards') {
  connection.asDashboardConnection().run()
} else (connection.getPageType() === 'looks') {
  connection.asLookConnection().run()
} else (connection.getPageType() === 'explore') {
  connection.asExploreConnection().run()
}
```

It is no longer necessary to recreate the IFRAME when there is a need to load different content. Instead the connection `loadDashboard`, `loadLook`, `loadExplore` or `loadUrl` methods can be used. The `loadDashboard`, `loadLook`, `loadExplore` methods accept an `id`. The `loadUrl` method accepts an Embed `URL` and so can be used to specify additional parameters, filters for example.

```javascript
connection.loadDashboard('42')
// OR
connection.loadUrl('/embed/dashboards/42?state=california')
```

If it is necessary to create a new IFRAME, the Embed SDK will not call the signing or acquire session endpoints again. Instead it will construct IFRAME src directly from the builder. Should it be necessary to create a new Embed session, the Embed SDK will need to be reinitialized as follows:

```javascript
getEmbedSDK(new LookerEmbedExSDK()).init('looker.example.com', '/auth')
```

## Building URLs for the SDK

_The Embed SDK 2.0.0 now supports URL building for cookieless embed._

The main documentation for Looker SSO embed URLs is [here](https://docs.looker.com/r/sdk/sso-embed).

The Embed SDK will sanitize the URL if necessary:

1. It will strip hostname and protocol if present.
2. It will prefix the URL with `/embed` if missing.
3. It will add the `sdk` parameter if missing.
4. It will add the `embed_domain` parameter if missing.
5. It will throw an error if the URL is invalid.

`/embed/looks/4?embed_domain=https://mywebsite.com` becomes `/embed/looks/4?embed_domain=https://mywebsite.com&sdk=3`.

<a name="the-auth-endpoint" name"the-auth-endpoint"></a>

## Signed URL Auth Endpoint

This section does not apply to cookieless embed. See the [cookieless embed](#cookieless) section for details.

In order to use the Embed SDK on the frontend you must supply a backend service that handles signing of the Embed URL. This service is called by the Embed SDK to generate a signed URL that is unique to the requesting user. The backend process can either generate the signed embed URL itself using an embed secret or can generate the URL by calling the [Looker Create Signed Embed URL API](https://cloud.google.com/looker/docs/reference/looker-api/latest/methods/Auth/create_sso_embed_url). Manual URL generation and signing avoids calling the Looker API resulting in decreased latency. Calling the Looker API requires less code and is easier to maintain.

A javascript example of a helper method that generates a signed URL, `createSignedUrl()`, can be found in [server/utils/auth_utils.ts](https://github.com/looker-open-source/embed-sdk/blob/master/server/utils/auth_utils.ts). Its usage is as follows:

```javascript
import { createSignedUrl } from './utils/auth_utils'

app.get('/looker_auth', function (req, res) {
  // It is assumed that the request is authorized
  const src = req.query.src
  const host = 'looker.example.com'
  const secret = ... // Embed secret from Looker Server Embed Admin page
  const user = ... // Embedded user definition
  const url = createSignedUrl(src, user, host, secret)
  res.json({ url })
})
```

A python example of the same method can be found [here](https://github.com/looker-open-source/embed-sdk/blob/master/server_utils/auth_utils.py).

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

<a name='cookieless' id='cookieless'></a>

## Cookieless Embed

_Cookieless embed in Embed SDK 2.0.0 now supports the use of `withUrl`._

Looker Cookieless embed allows the Looker application to be embedded by an html page that is served from a different domain than the Looker server. With signed URL embed, to avoid third party cookie blocking, the Looker server must be served from a sub domain of the hosting application OR the user must enable third party cookies in the browser. Enabling cookieless embedding is documented in more detail [here](https://cloud.google.com/looker/docs/r/sdk/cookieless-embed). Cookieless embed is available with Looker version 22.20 and above.

Cookieless embed works by using short lived tokens that are kept in the browser and are used to reference the actual session in the Looker server. The Looker UI keeps track of the tokens, and before they expire, requests that the hosting application generate new ones. To this end, the host application is required to implement supporting functionality in the client and in the server.

This functionality will:

- Acquire a new session either by creating or attaching to an existing session associated with the browser (this allows the user to create new IFRAMEs and use the same session).
- Generate new tokens.

### Acquire session backend process

This process is called every time a Looker Embed IFRAME is created. The acquire session backend process requires that the Looker API endpoint `acquire_embed_cookieless_session` be called to create an embed session or attach to an existing embed session. The endpoint accepts an embed user definition and creates or updates it. This is similar behavior to the signed URL embed login as they both can create and update embed user definitions.
One major difference in the payloads is that `force_logout_login` is ignored by `acquire_embed_cookieless_session`. Cookieless embed logins ALWAYS forces logout login (as the Looker cookies are blocked this should be a noop).

Cookieless embed sessions are associated with the user's browser user agent. It is important that that user agent for the browser be set with the request.

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

### Initializing the Embed SDK in the frontend

Cookieless embed is initialized by calling `getEmbedSDK().initCookieless(...)` passing in the Looker host value and the urls of the backend endpoints described previously. Once a Looker embed IFRAME is created it will communicate with the Embed SDK running in the host application and use the callbacks appropriately.

```javascript
getEmbedSDK().initCookieless(
  'looker.example.com',
  '/acquire-embed-session',
  '/generate-embed-tokens'
)
```

### Embed domain allow list

Looker embed SSO requires that the host application domain be added to an allow list using the Looker configure admin page. Starting with Looker version `23.8`, the embed domain can be specified in the payload of the `acquire_embed_cookieless_session` call. This allows customers to dynamically specify the allowed domains. The allowed domain is associated with the embed session stored in the Looker server and is NOT persisted to the internal Looker database. This means that the embed domain must be included with every `acquire_embed_cookieless_session` call.

When implementing it is HIGHLY recommended that the implementor NOT trust any embed domain sent from the browser (in other words do not use the location.origin from the browser). Instead, the embed application should implement a mechanism in the server that maps a user to particular domain.

To add the embed domain to the `acquire_embed_cookieless_session` payload set the `LOOKER_USE_EMBED_DOMAIN` variable to true in the `.env` file

## Demonstration Application

The `./demo` directory contains the frontend code for an embedded application. The following features can demonstrated:

1. Signed URL embedding using a single IFRAME. Multiple Looker object types and instances can be loaded using a single IFRAME.
2. Signed URL embedding using multiple IFRAMEs. An IFRAME can be created for a dashboard, look, explore and/extension.
3. Cookieless embedding using a single IFRAME. Multiple Looker object types and instances can be loaded using a single IFRAME.
4. Cookieless embedding using multiple IFRAMEs. An IFRAME can be created for a dashboard, look, explore and/extension.
5. Embed Message API embedding (this is provided for information purposes only and demonstrates how to embed Looker without using the Embed SDK).

### Step 1 - Enable Embedding in your Looker instance

Enabling signed URL embedding is documented in more detail [here](https://cloud.google.com/looker/docs/single-sign-on-embedding).
Enabling cookieless embedding is documented in more detail [here](https://cloud.google.com/looker/docs/r/sdk/cookieless-embed).

- Navigate to Admin > _Platform_ Embed on your Looker instance. This requires Admin privileges.
- The demo server runs by default at [http://localhost:8080](http://localhost:8080). By adding that address to the "Embedded Domain Allowlist" you can enable the demo to receive messages from Looker.
- Turn on "Embed SSO Authentication"
- In order to use embedding you must generate an "Embed Secret" for SSO embedding and/or a JWT secret for cookieless embedding. A Looker instance can support signed URL and cookieless embedding simultaneously.

Additional steps to activate cookieless embed:

- Navigate to `Admin > Platform > Embed` on your Looker instance. This requires Admin privileges.
- Enable Cookieless Embed.
- Generate an Embed JWT secret. This is used internally and the hosting application does not need to know what it is.

### Step 2 - Customize the Demo settings for your Looker instance

The embed demo environment can be configured using a `.env` file. The following is a template that can be used to create the file (in the root of this repo). The `.env` file should never be stored in your git repo and is included in the repo's `.gitignore` file.

```shell
# Demo Server Configuration

# Protocol for the demo server to listen
# http or https. Use https if Reports are to be embedded
LOOKER_DEMO_PROTOCOL=http
# Allow server to be called using a URL other than localhost or 127,0.0.1
# Set to true when developing Embedded Reports
LOOKER_DEMO_HOST_EXTERNAL=false
# Looker Web Server (omit the protocol)
# LOOKER_EMBED_HOST can also be used
LOOKER_WEB_URL=mycompany.looker.com
# Looker API server (include the protocol)
# LOOKER_EMBED_API_URL can also be used
LOOKER_API_URL=https://mycompany.looker.com:19999
# Host name for the demo server
LOOKER_DEMO_HOST=localhost
# Port for the demo server
LOOKER_DEMO_PORT=8080
# Demo server cookie secret (used to encrypt the cookie)
COOKIE_SECRET=cookie_stash
# Verify the Looker certificate (for most embed developers, the Looker certificate will be valid)
LOOKER_VERIFY_SSL=true

# Looker Embed Configuration

# Embed type to demo
# signed - use signed embedding
# cookieless - use cookieless embedding
# private - use private embedding
LOOKER_EMBED_TYPE=signed
# Looker embed secret - from /admin/embed page
LOOKER_EMBED_SECRET=
# Looker client id - from /admin/users/api3_key/{id}
LOOKER_CLIENT_ID=
# Looker client secret - from /admin/users/api3_key/{id}
LOOKER_CLIENT_SECRET=
# Use dynamic embed domains for cookieless embed
LOOKER_USE_EMBED_DOMAIN=false

# Looker Embed Data Configuration
# Set to "-" if demo needs to ignore it

# Dashboard IDs
LOOKER_DASHBOARD_ID=1
LOOKER_DASHBOARD_ID_2=2
# Look ID
LOOKER_LOOK_ID=1
# Explore ID
LOOKER_EXPLORE_ID=thelook::orders
# Extension ID
LOOKER_EXTENSION_ID=extension::my-great-extension
# Report ID
LOOKER_REPORT_ID=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee
# Query Visualization ID
LOOKER_QUERY_VISUALIZATION_ID=1234567890ABCDEF123456

# Theme configuration, Dashboards, Looks and Explores
LOOKER_THEME=Dark
LOOKER_CUSTOM_THEME={"show_title":false,"show_filters_bar":false,"text_tile_text_color":"blue"}
```

- Edit the `demo/demo_user.json` file to be appropriate for the type of user you want to embed. Normally your backend service would use information about the user logged into your embedding application to inform Looker about important user properties that control data access controls. The `demo/demo_user.json` file is also used for cookieless embedding. Remember that cookieless_embed always treats `force_logout_login` as `true`. See [documentation](https://cloud.google.com/looker/docs/single-sign-on-embedding) for detailed information on the content of the embed user definition.

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

The hosting window and the embedded IFRAME have separate local storage, so you can enable logging on one, the other, or both. You can disable logging with

```javascript
localStorage.debug = undefined
```

## Embedded Javascript Events

Prior to the release of the Embed SDK, Looker exposed an API that utilized JavaScript `postMessage` events. This API is still available for customers who cannot or do not want to use the Embed SDK (using the Embed SDK is highly recommended as it provides additional functionality and is simpler to use). An example application has been created to ensure that cookieless embed also works with JavaScript `postMessage` events. This example can be found [here](demo/message_example.ts).

## Additional Considerations

## Embedded Reports

Beginning with Embed SDK 2.0.0 and Looker 25.6, Looker supports the embedding of Report content. Due to the complexities of some of the CSP checking for Embedded Studio Reports in Looker some additional setup needs to be undertaken by the embed developers wishing to embed Reports.

1. Development servers must run on https. If the embed demo server is being used, set the `.env` LOOKER_DEMO_PROTOCOL variable to https. If you intend to use `npm run server` you will need to generate an SSL certificate and a private key. See below for instuctions on how to do this.
2. The development server must run on a subdomain of the domain that the Looker server is running on. This can be simulated by adding the subdomain and domain to your `/etc/hosts` file. If the embed demo server is being used, set the `.env` LOOKER_DEMO_HOST_EXTERNAL variable to true. This allows the demo server to accept connections from the required URL. If the demo server is being used an invalid certificate will be generated. You will need to type `thisisunsafe` when accessing the server through a chrome browser.

### Generate an SSL certificate and private key

The following commands will generate a certificate and private key that can be used to have the demo server use https. Note that the certificate is for development purposes only and the browser will warn you that the certificate is invalid when it connects to the server. Click advanced and type "thisisunsafe" in order to continue (if using chrome).

#### Generate a certificate

`openssl req -x509 -newkey rsa:2048 -keyout server/keytmp.pem -out server/cert.pem -days 365`

Enter the PEM pass phrase and remember it (it is needed to generate the key).
Enter or accept the defaults for all of the following prompts.

#### Generate a key

`openssl rsa -in server/keytmp.pem -out server/key.pem`

The demo server may now be started using the command `npm start server`.

## Navigating to different content using loadUrl, loadDashboard, loadLook, loadReport etc

Prior to Embed SDK 2.0.0 the `loadDashboard` method allowed embedding applications to navigate between dashboards. The Looker server would prevent navigation if the dashboard was being edited. With Embed SDK 2.0.0, the Looker server no longer prevents navigation if a Dashboard is being edited (or for that matter if a Look is being edited). Instead, if the host application wants to prevent navigation if a dashboard or look is being edited, it can query the connection to see if an edit is in progress. Example:

```
if (embedConnection?.isEditing()) {
  updateStatus('Navigation not allowed while editing')
} else {
  embedConnection.loadDashboard('42')
}
```

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

### Merged query edit flow

Starting with Looker 25.12, the Embed SDK is aware of the merged query edit flow. By default, Looker opens the merged query edit in a separate tab. This tab is owned by Looker, not the Embedding application. The Embed SDK now allows the embedding application to change this behavior. There are two options available:

1. Let the embedding application handle the behavior.
2. Let the Embed SDK handle the behavior.

#### Let the Embedding application handle the merge query edit flow

The embedding application must add a listener for the `dashboard:tile:merge` event

```javascript
getEmbedSDK()
  .createDashboardWithId('42')
  .on('dashboard:tile:merge', openMergeQuery)
  .appendTo('#dashboard')
  .build()
  .connect()
```

The handler is expected to cancel the event (in which case Looker will do nothing). The embedding application can then create a new embedding IFRAME using the url that is included in the event payload. The following needs to be considered when implementing this behavior in the embedding application.

If the dashboard has been modified there is the potential that the user may lose edits made to the dashboard. The embedding application has the choice of doing nothing (in which case any edits may be lost), ask the user to confirm that they are okay with losing the edits or display a message to the user asking them to save the edits before editing the merge query.

How should the embedding application handle the merge query. There are a few approaches:

- The simplest approach is to open a new tab, passing the merge query edit URL as a query string parameter. Once the tab is open the embedding application is loaded, it can instantiate the Looker IFRAME using the merge query URL from the query parameter.
- Another approach is to create a hidden form in the DOM with a POST method, a target window name and a hidden field containing the merge query URL. Once created the form is submitted. The tab is then opened by the browser and the embedding application is loaded and can instantiate the Looker IFRAME using the merge query edit URL which would need to be included in the load HTML somewhere.
- Yet another approach is to hide the existing Looker IFRAME and create a new Looker IFRAME using the embed SDK with the merge query edit URL. The merge query edit URL MUST NOT be loaded using the current embed connection. This will not work as Looker will lose the context of the dashboard being edited. Once the new IFRAME has loaded and the connection established, the old IFRAME can be destroyed.

**Example handler**

```javascript
const openMergeQuery = (
  event: DashboardTileMergeEvent
): CancellableEventResponse => {
  let doMergeEdit = false
  if (!event.dashboard_modified) {
    doMergeEdit = true
  } else {
    // Ask the user to confirm they are okay with losing edits
    doMergeEdit = window.confirm(
      'The dashboard has unsaved changes which may be lost if the merge query is edited. Proceed?'
    )
  }
  if (doMergeEdit) {
    // The "/merge_edit" route must be implemented by the embedding application.
    window.open(`/merge_edit?merge_url=${encodeURIComponent(event.url)}`)
    updateStatus('Merge query edit opened in a new window')
  } else {
    updateStatus('Merge query edit cancelled')
  }
  return { cancel: true }
}
```

#### Let the Embed SDK handle the merge query edit flow

The embed SDK implements the option to hide the current IFRAME and create a new IFRAME. It can be activated as follows:

```javascript
getEmbedSDK()
  .createDashboardWithId('42')
  .withMergedQueryEditFlow()
  .on('dashboard:tile:merge', openMergeQuery)
  .appendTo('#dashboard')
  .build()
  .connect()
```

Consideration needs to be given about handling dashboards that have been edited. There are two options:

1. Provide a message asking the user to confirm that they are okay with losing any edits. The user may cancel and save the edits.
2. Automatically cancel the merge query edit request. The embedding application may then inform the user that the dashboard edits need to be saved.

**Example with confirm message**

```javascript
getEmbedSDK()
  .createDashboardWithId('42')
  .withMergedQueryEditFlow({
    confirmMessageIfDashboardModified:
      'Dashboard has been modified. Proceed and lose edits?',
  })
  .appendTo('#dashboard')
  .build()
  .connect()
```

**Example with automatic cancel**

```javascript
getEmbedSDK()
  .createDashboardWithId('42')
  .withMergedQueryEditFlow({ cancelIfDashboardModified: true })
  .on('dashboard:tile:merge', () => {
    updateStatus(
      'Please save the dashboard changes before editing the merge query'
    )
    return { cancel: true }
  })
  .appendTo('#dashboard')
  .build()
  .connect()
```
