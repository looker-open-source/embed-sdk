# Looker JavaScript Embed SDK

## Introduction

The Looker JavaScript Embed SDK is designed to facilitate using Looker embedded content in your web application. The goal is to make communication between a host website and one or more embedded dashboards, looks or explores easier and more reliable.

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
  .on('dashboard:run:start',
      () => updateState('#dashboard-state', 'Running')
  )
  .on('dashboard:run:complete',
      () => updateState('#dashboard-state', 'Done')
  )
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

First initialize the SDK with address of your Looker server and the endpoint on your server that will perform authentication. (Note: Port must be included if it is required to reach the Looker server from browser clients, e.g. looker.example.com:443, but the protocol (http/https) should *not* be included.

```javascript
LookerEmbedSDK.init('looker.example.com', '/auth')
```

In this example, `/auth` is a backend service that you must implement as described in the [Auth](#the-auth-endpoint) section.

After the SDK is initialized, begin by creating the builder with an `id`. For example, to create a dashboard embed builder:

```javascript
LookerEmbedSDK.createDashboardWithId(id)
```

The `createDashboardWithId` function will call your backend `/auth` endpoint and expect a signed embed URL in response. Subsequent embeds can be generated using `createDashboardWithUrl` which accepts a partial URL matching [this form](https://docs.looker.com/reference/embedding/sso-embed#building_the_embed_url), for example: `/embed/dashboards/`. The URL create functions will not call your backend `/auth` service. If you are embedding
multiple items on a single page,  use ID create functions first and then URL create functions subsequently to avoid redundant calls to your auth backend.

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

If you want to send and receive messages to the embedded element you need to call `connect()` which returns a Promise that resolves to the communication interface of the given element:

```javascript
  .connect()
  .then(setupDashboard)
  .catch(console.error)
```

## Building URLs for the SDK

The main documentation for Looker SSO embed URLs is [here](https://docs.looker.com/r/sdk/sso-embed). The only difference when creating URLs for the SDK is that you will need to add an `sdk=2` parameter to the Embed URL alongside other parameters like filters and the `embed_domain` parameter. This parameter allows Looker to identify that the SDK is present and can take advantage of additional features provided by the SDK.

```html
/embed/looks/4?embed_domain=https://mywebsite.com => /embed/looks/4?embed_domain=https://mywebsite.com&sdk=2
```

The SDK cannot add this parameter itself because it part of the signed SSO URL.

## The Auth Endpoint

In order to use the embed SDK on the frontend you must supply a backend service that handles authentication. This service is called by the SDK to generate a signed iframe URL that is unique to the requesting user. The best practice is for your backend service to generate the URL by calling the Looker API. 

The *backend* process entails hosting a service at an endpoint such as `/looker_auth` which does the following.

1. Your backend service initializes the [Looker API SDK](https://docs.looker.com/reference/api-and-integration/api-sdk) based on a client API key and secret typically stored in `Looker.ini` file.

2. Your backend service is called by the Embed SDK and provided with a query string in the URL containing the desired embedding.

3. Your backend service takes the information from the Embed SDK *along with any information about the currently authenticated user* and calls the Looker API to create a signed URL:

```python
# receives a request path that includes /looker_auth 
# as well as the target URL in a query string
req_parts = urlparse(request_path) 
req_query = parse_qs(parts.query)
embed_url = req_query['src'][0]
target_url =  'https://' + LOOKER_HOST +  '/login/embed/' + urllib.parse.quote_plus(embed_url)
target_sso_url = looker_sdk.models.EmbedSsoParams(target_url, ...) # ... corresponds to very important user attributes
sso_url = looker_api_sdk.create_sso_embed_url(body = target_sso_url) # this is the signed embed URL that is returned 
```

The *frontend* process using the Embed SDK entails:

1. The embed SDK is initialized with the Looker host and the backend service:

```javascript
LookerEmbedSDK.init('looker.example.com', '/looker_auth')
```

2. Anytime you invoke a builder with the ID create function the Embed SDK makes a request to the backend, `/looker_auth`, containing a query string with the desired content embed URL along with any provided parameters:

```javascript
LookerEmbedSDK.createcreateDashboardWithId(11)
 .build()
// results in a request that includes a query string with:
// /embed/dashboards/11?sdk=2&embed_host=https://yourhost.example.com&...
```

3. The Embed SDK inserts an iframe using the signed URL returned from the backend as the src:

```html
src=https://looker.example.com/embed/dashboards/11?sdk=2&embed_host=https://yourhost.example.com&...
```

### Advanced Auth Configuration

The Auth endpoint can be configured further, allowing custom Request Headers, as well as CORS support by passing an options object to the `init` method 

```javascript
LookerEmbedSDK.init('looker.example.com', 
  {
    url: 'https://api.acme.com/looker/auth',
    headers: [{'name': 'Foo Header', 'value': 'Foo'}],
    params: [{'name': 'foo', 'value': 'bar'}],
    withCredentials: true // Needed for CORS requests to Auth endpoint include Http Only cookie headers
  })
``` 

### Node helper

If you prefer, your backend service can [implement the signature function](https://github.com/looker/looker_embed_sso_examples) instead of calling the Looker API by using a [Looker Embed secret](https://docs.looker.com/r/sdk/sso-embed). Manually generating the signed URL avoids a call to the Looker API but is more error prone.

One example of a helper method that generates a signed URL, `createSignedUrl()`, is provided in
[server_utils/auth_utils.ts](blob/master/demo/demo_config.ts). Its usage is as follows:

```javascript
import { createSignedUrl } from './auth_utils'

app.get('/looker_auth', function(req, res) {
  // Authenticate the request is from a valid user here
  const src = req.query.src;
  const host = 'looker.example.com'
  const secret = YOUR_EMBED_SECRET
  const user = authenticatedUser
  const url = createSignedUrl(src, user, host, secret);
  res.json({ url });
});
```

The `user` data structure is

```typescript
interface LookerEmbedUser {
  external_user_id: string
  first_name?: string
  last_name?: string
  session_length: number
  force_logout_login?: boolean,
  permissions: LookerUserPermission[]
  models: string[]
  group_ids?: number[]
  external_group_id?: string
  user_attributes?: {[key: string]: any}
  access_filters: {[key: string]: any}
}
```

## Demo

A simple demo is provided in the `/demo` directory that uses a basic JS frontend and a Python backend. The example backend `demo.py` uses the Looker API to create a signed URL. The example backend `demo_self_signed.py` uses the embed secret and a helper function to sign the URL. The instructions below are for the example using the Looker API.

### Step 1 - Enable Embedding in your Looker instance

(This is documented in more detail [here](https://docs.looker.com/r/sdk/sso-embed))

* Navigate to Admin > *Platform* Embed on your Looker instance. This requires Admin privileges.
* The demo server runs by default at [http://localhost:8080](http://localhost:8080). By adding that address to "Embedded Domain Whitelist" you can enabled the demo to receive messages from Looker.
* Turn on "Embed Authentication"
* In order to use embedding you must generate an "Embed Secret"

### Step 2 - Customize the Demo settings for your Looker instance

* If you are using the main `demo.py`, provide your API credentials to the server by updating `demo/looker.ini` following [these instructions](https://community.looker.com/technical-tips-tricks-1021/the-how-to-on-initializing-the-sdk-with-different-profiles-in-your-ini-file-26846), with credentials obtained from [the Users page](https://docs.looker.com/reference/api-and-integration/api-auth).

* Alternatively, if you are using `demo_self_signed.py`, provide your embed secret to the server. You can do this a couple ways.
  * Set it as `LOOKER_EMBED_SECRET` in your shell environment.
  * Create a file named `.env` in the root of the sdk directory. Add a line to that file: `LOOKER_EMBED_SECRET="YourLookerSecret"`

* Provide your Looker instance host address to the server:
  * Create a `.env` file in the main embed-sdk directory and add `LOOKER_EMBED_HOST="yourinstance.looker.com:yourport"`
  * **The Looker embed host should not include the protocol!** 

* Edit the `demo/demo_config.ts` file to be appropriate for the pages you want to embed.

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

* Edit the `demo/demo_user.json` file to be appropriate for the type of user you want to embed. Normally your backend service would use information about the user logged into your embedding application (e.g your customer portal) to inform Looker about important user properties that control data access grants.

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

Run the following commands from the top-level embed-sdk directory.

* `npm install`
* `npm run python`
* The server will print out what host and port it is running on.

If you want to use the `demo_self_signed.py` example you will need to update `packages.json` and replace `demo.py` with `demo_self_signed.py`.

## Troubleshooting

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
