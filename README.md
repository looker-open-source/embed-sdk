# Looker JavaScript Embed SDK

## Introduction

The Looker JavaScript Embed SDK is designed to facilitate using Looker embedded content in your web application. The goal is to make communication between a host website and one or more embedded dashboards, looks, explores and extensions easier and more reliable.

The Looker JavaScript Embed SDK typically uses embed SSO to sign an embed url in order to authenticate the user of the embed. This mechanism relies on Looker cookies being available to the embedded IFRAME in order for the application to work. Looker also provides a mechanism that allows embedded Looker IFRAMES to work without the need for cookies. Details can be found [here](#cookieless). Embed SDK functionality that will not work with cookieless embed is identified in this document.

A typical setup might look like this. In this case, a dashboard with an id of `11` is created inside a DOM element with the id `dashboard`. The `dashboard:run:start` and `dashboard:run:complete` events are used to update the state of the embedding window's UI, and a button with an id of `run` is scripted to send a `dashboard:run` message to the dashboard.

```javascript
LookerEmbedSDK.init('looker.example.com', '/auth')

const setupDashboard = (dashboard) => {
  document.querySelector('#run').addEventListener('click', () => {
    dashboard.send('dashboard:run')
  })
}

LookerEmbedSDK.createDashboardWithId(11)
  .appendTo('#dashboard')
  .on('dashboard:run:start', () => updateState('#dashboard-state', 'Running'))
  .on('dashboard:run:complete', () => updateState('#dashboard-state', 'Done'))
  .build()
  .connect()
  .then(setupDashboard)
  .catch((error: Error) => {
    console.error('An unexpected error occurred', error)
  })
```

A more complete example can be found [here](demo/demo.ts). Detailed instructions on how to use it are [here](#demo).

## Details

The Looker Embed SDK uses a fluent interface pattern. The construction of the embedded content is broken into two phases, building and connecting.

### Building

First initialize the SDK with address of your Looker server and the endpoint on your server that will perform authentication. (Note: Port must be included if it is required to reach the Looker server from browser clients, e.g. looker.example.com:1919, but the protocol (http/https) should _not_ be included.)

```javascript
LookerEmbedSDK.init('looker.example.com', '/auth')
```

In this example, `/auth` is a backend service that you must implement as described in the [Auth](#the-auth-endpoint) section.

After the SDK is initialized, begin by creating the builder with an `id`. For example, to create a dashboard embed builder:

```javascript
LookerEmbedSDK.createDashboardWithId(id)
```

You can then add additional attributes to the builder to complete your setup:

```javascript
  .appendTo('#dashboard')
```

You can add event handlers:

```javascript
  .on('dashboard:run:start',
      () => updateState('#dashboard-state', 'Running')
  )
  .on('dashboard:run:complete',
      () => updateState('#dashboard-state', 'Done')
  )
```

You finish by building the embedded element:

```javascript
  .build()
```

The `createDashboardWithId` function will call your backend `/auth` endpoint when `build` is invoked and requires a signed embed URL in response. Subsequent embeds can be generated using `createDashboardWithUrl` which accepts a partial URL matching [this form](https://docs.looker.com/reference/embedding/sso-embed#building_the_embed_url), for example: `/embed/dashboards/`. The URL create functions will not call your backend `/auth` service. If you are embedding multiple items on a single page, use ID create functions first and then URL create functions subsequently to avoid redundant calls to your auth backend.

If you want to send and receive messages to the embedded element you need to call `connect()` which returns a Promise that resolves to the communication interface of the given element:

```javascript
  .connect()
  .then(setupDashboard)
  .catch(console.error)
```

## Building URLs for the SDK

This section does not apply to cookieless embed as building URLs in this manner is not supported. See the [cookieless embed](#cookieless) section for details.

The main documentation for Looker SSO embed URLs is [here](https://docs.looker.com/r/sdk/sso-embed). The only difference when creating URLs for the SDK is that you will need to add an `sdk=2` parameter to the Embed URL alongside other parameters like filters and the `embed_domain` parameter. This parameter allows Looker to identify that the SDK is present and can take advantage of additional features provided by the SDK.

```html
/embed/looks/4?embed_domain=https://mywebsite.com =>
/embed/looks/4?embed_domain=https://mywebsite.com&sdk=2
```

The SDK cannot add this parameter itself because it part of the signed SSO URL.

## The Auth Endpoint

This section does not apply to cookieless embed as an alternate mechanism for authentication is used. See the [cookieless embed](#cookieless) section for details.

In order to use the embed SDK on the frontend you must supply a backend service that handles authentication. This service is called by the SDK to generate a signed iframe URL that is unique to the requesting user. The backend process can either generate the signed embed URL itself using an embed secret or the backend process can generate the URL by calling the Looker API. Manual URL generation and signing avoids calling the Looker API resulting in decreased latency. Calling the Looker API requires less code and can be easier to maintain.

### Backend Process

This section does not apply to cookieless embed but a backend process is still required. See the [cookieless embed](#cookieless) section for details.

The _backend_ process entails hosting a service at an endpoint such as `/auth` which does the following:

1. The backend service initializes the [Looker API SDK](https://cloud.google.com/looker/docs/api-sdk) based on a client API key and secret typically stored in `Looker.ini` file.

2. The Embed SDK calls the backend service and provides a query string containing the desired embedding.

3. The backend service takes the information from the Embed SDK _along with any information about the currently authenticated user_ and generates the signed URL. For example, this Python code represents a partial example of a backend that generates the signed URL by calling the Looker API:

```python
# receives a request path that includes /looker_auth
# as well as the target URL in a query string
req_parts = urlparse(request_path)
req_query = parse_qs(req_parts.query)
embed_url = req_query['src'][0]
target_url =  'https://' + LOOKER_HOST +  '/login/embed/' + urllib.parse.quote_plus(embed_url)
target_sso_url = looker_sdk.models.EmbedSsoParams(target_url, ...) # ... corresponds to very important user attributes
sso_url = looker_api_sdk.create_sso_embed_url(body = target_sso_url) # this is the signed embed URL that is returned
```

### Frontend Process

This section does not apply to cookieless embed but frontend initialization is still required. See the [cookieless embed](#cookieless) section for details.

The _frontend_ process using the Embed SDK entails:

1. The embed SDK is initialized with the Looker host and the backend service:

```javascript
LookerEmbedSDK.init('looker.example.com', '/auth')
```

2. Anytime you invoke a builder with the ID create function the Embed SDK makes a request to the backend, `/looker_auth`, containing a query string with the desired content embed URL along with any provided parameters:

```javascript
LookerEmbedSDK.createDashboardWithId(11).build()
// results in a request that includes a query string with:
// /embed/dashboards/11?sdk=2&embed_deomain=https://yourhost.example.com&...
```

3. The Embed SDK inserts an iframe using the signed URL returned from the backend as the src.

### Advanced Auth Configuration

This section does not apply to cookieless embed as an alternate mechanism for authentication is used. See the [cookieless embed](#cookieless) section for details.

The Auth endpoint can be configured further, allowing custom Request Headers, as well as CORS support by passing an options object to the `init` method

```javascript
LookerEmbedSDK.init('looker.example.com', {
  url: 'https://api.acme.com/looker/auth',
  headers: [{ name: 'Foo Header', value: 'Foo' }],
  params: [{ name: 'foo', value: 'bar' }],
  withCredentials: true, // Needed for CORS requests to Auth endpoint include Http Only cookie headers
})
```

### Node helper

This section does not apply to cookieless embed as an alternate mechanism for authentication is used. See the [cookieless embed](#cookieless) section for details.

If you prefer, your backend service can [implement the signature function](https://github.com/looker/looker_embed_sso_examples) instead of calling the Looker API by using a [Looker Embed secret](https://docs.looker.com/r/sdk/sso-embed). Manually generating the signed URL avoids a call to the Looker API but is more error prone.

One example of a helper method that generates a signed URL, `createSignedUrl()`, is provided in
[server_utils/auth_utils.ts](blob/master/demo/demo_config.ts). Its usage is as follows:

```javascript
import { createSignedUrl } from './auth_utils'

app.get('/looker_auth', function (req, res) {
  // Authenticate the request is from a valid user here
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

Note that cookieless embed does not yet support the use of `withUrl`. An attempt to use this functionality will result in an error being thrown.

Looker cookieless embed allows the Looker application to be embedded by an html page that is served from a different domain than the Looker host. With SSO embed, to avoid third party cookie blocking, the Looker application must be served from a sub domain of the hosting application OR the user must enable third party cookies in the browser. Enabling cookieless embedding is documented in more detail [here](https://cloud.google.com/looker/docs/r/sdk/cookieless-embed). Cookieless embed is available with Looker version 22.20 and above.

Cookieless embed works by using short lived tokens that are kept in the browser and are used to reference the actual session in the Looker server. The Looker UI keeps track of the tokens, and before they expire, requests that the hosting application generate new ones. To this end, the host application is required to implement functionality in the client and in the server.

This functionality will:

- Acquire a new session either by creating or attaching to an existing session associated with the browser (this allows the user to create new IFRAMEs and use the same session).
- Generate new tokens.

### Acquire session backend process

This process will be called every time a Looker embed IFRAME is created. The acquire session backend process requires that the Looker api endpoint `acquire_embed_cookieless_session` be called to create an embed session or attach to an existing embed session. This endpoint is responsible for creating the embed user. This is different from embed SSO whereby the embed login creates the embed user. One major difference in the payloads is that `force_logout_login` is ignored by `acquire_embed_cookieless_session`. Cookieless embed logins ALWAYS force logout login (as there should be no Looker cookies this should be a noop). It should also be noted that this endpoint will NOT update the embed user in Looker if it already exists. There are other endpoints in Looker that can do this.

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

Cookieless embed is initialized by calling `LookerEmbedSDK.initCookieless` passing in the Looker host value and the the urls of the backend endpoints described previously. Once a Looker embed IFRAME is created it will communicate with the Embed SDK running in the host application and use the callbacks appropriately.

```javascript
LookerEmbedSDK.initCookieless(
  'looker.example.com',
  '/acquire-embed-session',
  '/generate-embed-tokens'
)
```

## Demo

A simple demo is provided in the `/demo` directory that uses a basic JS frontend and a Python backend. The example backend `demo.py` uses the Looker API to create a signed URL. The example backend `demo_self_signed.py` uses the embed secret and a helper function to sign the URL. The instructions below are for the example using the Looker API.

The python simple demo server does not support cookieless embed but alternative TypeScript backend is available which does support cookieless embed.

### Step 1 - Enable Embedding in your Looker instance

Enabling SSO embedding is documented in more detail [here](https://cloud.google.com/looker/docs/single-sign-on-embedding).
Enabling cookieless embedding is documented in more detail [here](https://cloud.google.com/looker/docs/r/sdk/cookieless-embed).

- Navigate to Admin > _Platform_ Embed on your Looker instance. This requires Admin privileges.
- The demo server runs by default at [http://localhost:8080](http://localhost:8080). By adding that address to "Embedded Domain Whitelist" you can enabled the demo to receive messages from Looker.
- Turn on "Embed SSO Authentication"
- In order to use embedding you must generate an "Embed Secret" for SSO embedding and/or a JWT secret for cookieless embedding. Note that a Looker instance can support both types of embedding at the same time.

Additional steps for cookieless embed:

- Navigate to Admin > _Platform_ Embed on your Looker instance. This requires Admin privileges.
- Generate an Embed JWT secret. This is used internally and the hosting application does not need to know what it is.
- Navigate to Admin > _Labs_ Experimental on your Looker instance. This requires Admin privileges.
- Toggle "Cookieless Embed" on. Note that a Looker instance can support SSO and Cookieless embed clients.

### Step 2 - Customize the Demo settings for your Looker instance

Note that `demo.py` and `demo_self_signed.py` have NOT been updated to support cookieless embedding. This section ONLY applies to SSO embedding. The cookieless embed demo currently requires the use of the development server.

- If you are using the main `demo.py`, provide your API credentials to the server by updating `demo/looker.ini` following [these instructions](https://community.looker.com/technical-tips-tricks-1021/the-how-to-on-initializing-the-sdk-with-different-profiles-in-your-ini-file-26846), with credentials obtained from [the Users page](https://cloud.google.com/looker/docs/api-auth).

- Alternatively, if you are using `demo_self_signed.py`, provide your embed secret to the server. You can do this a couple ways.

  - Set it as `LOOKER_EMBED_SECRET` in your shell environment.
  - Create a file named `.env` in the root of the sdk directory. Add a line to that file: `LOOKER_EMBED_SECRET="YourLookerSecret"`

- Another alternative is to use the TypeScript demo server. The embed secret can be provided in the following way:

  - Set it as `LOOKER_EMBED_SECRET` in your shell environment.
  - Create a file named `.env` in the root of the sdk directory. Add a line to that file: `LOOKER_EMBED_SECRET="YourLookerSecret"`

- Provide your Looker instance host address to the server:

  - Create a `.env` file in the main embed-sdk directory and add `LOOKER_EMBED_HOST="yourinstance.looker.com:yourport"`
  - **The Looker embed host should not include the protocol!**

- Edit the `demo/demo_config.ts` file to be appropriate for the pages you want to embed. It is also possible to override the `demo/demo_config.ts` in the `.env` file. See [here](#env) for more details.

```javascript
// The address of your Looker instance. Required.
// Include the port if it is necessary when accessing looker in a browser
// Do NOT include the protocol
export const lookerHost = 'self-signed.looker.com:9999'

// A dashboard that the user can see. Set to 0 to disable dashboard.
export const dashboardId = 1
// A Look that the user can see. Set to 0 to disable look.
export const lookId = 1
```

- Edit the `demo/demo_user.json` file to be appropriate for the type of user you want to embed. Normally your backend service would use information about the user logged into your embedding application (e.g your customer portal) to inform Looker about important user properties that control data access controls. Note that the `demo/demo_user.json` file is also used for cookieless embedding. The one difference is that cookieless_embed will ignore the value of `force_logout_login` and will ALWAYs treat the value as `true`.

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
  //   access_data
  //   see_looks
  //   see_user_dashboards
  //   see_lookml_dashboards
  //   explore
  //   create_table_calculations
  //   download_with_limit
  //   download_without_limit
  //   see_drill_overlay
  //   see_sql
  //   save_content
  //   embed_browse_spaces
  //   schedule_look_emails
  //   send_to_sftp
  //   send_to_s3
  //   send_outgoing_webhook
  //   schedule_external_look_emails
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

The following applies to SSO embed only. Run the following commands from the top-level embed-sdk directory.

- `npm install`
- `npm run python`
- The server will print out what host and port it is running on.

If you want to use the `demo_self_signed.py` example you will need to update `packages.json` and replace `demo.py` with `demo_self_signed.py`.

Alternatively run the TypeScript demo server which also supports cookieless embed.

- `npm install`
- `npm run server`
- The server will listen on port 8080.

### Logging

The Embed SDK is built on top of [chatty](https://github.com/looker-open-source/chatty). Chatty uses [debug](https://github.com/visionmedia/debug) for logging. You can enable logging
in a browser console with

```javascript
localStorage.debug = 'looker:chatty:*'
```

Note that both the parent window and the embedded content have separate local storage, so you can enable logging on one, the other or both. You can disable logging with

```javascript
localStorage.debug = ''
```

### <a name='env' id='env'></a> `.env` setup

The embed demo environment can be configured using a `.env` file. The following is a template that can be used to create the file (in the root of this repo). The `.env` file should never be stored in your git repo and is included in the repo's `.ignore` file.

```shell
LOOKER_EMBED_HOST=mycompany.looker.com
LOOKER_EMBED_API_URL=https://mycompany.looker.com:19999
LOOKER_DEMO_HOST=localhost
LOOKER_DEMO_PORT=8080
LOOKER_EMBED_SECRET=
LOOKER_CLIENT_ID=
LOOKER_CLIENT_SECRET=
LOOKER_DASHBOARD_ID=1
LOOKER_LOOK_ID=1
LOOKER_EXPLORE_ID=thelook::orders
LOOKER_EXTENSION_ID=extension::my-great-extension
COOKIE_SECRET=cookie_stash
```

## Embedded Javascript Events

Prior to the release of the Embed SDK, Looker exposed an API that utilized JavaScript `postMessage` events. This API is still available for customers who cannot or do not want to use the Embed SDK (note that using the Embed SDK is highly recommended as it provides additional functionality and is simpler to use). An example application has been created to ensure that cookieless embed also works with JavaScript `postMessage` events. This example can be found [here](demo/message_example.ts).
