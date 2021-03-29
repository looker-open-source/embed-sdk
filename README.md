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

First initialize the SDK with address of your Looker server and, optionally, the endpoint on your server that will perform authentication.  (Note: Port must be included if it is required to reach the Looker server from browser clients, e.g. looker.example.com:443)
These are used by all the embedded content.

```javascript
LookerEmbedSDK.init('looker.example.com', '/auth')
```

Then the embedded content is built using a series of steps to define its parameters. Some if these parameters are optional, and some are mandatory.

The process starts with creating the builder with an `id`, or a `url` created by the processed described [here](https://docs.looker.com/r/sdk/sso-embed):

```javascript
LookerEmbedSDK.createDashboardWithId(id)
```

or

```javascript
LookerEmbedSDK.createDashboardWithUrl(url)
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

Because the embed secret needs to be carefully guarded, embed SSO URLs cannot be created in the browser. To make the process easier and secure, you can instead do the following:

1. Implement a URL signing function in your web server. The server should return a signed URL using one of the processes documented in the [Looker Embed SSO Examples](https://github.com/looker/looker_embed_sso_examples) Github repository.

2. Pass the embed SSO URL to that signing endpoint in the embed SDK. The location of the endpoint is specified by the `authUrl` parameter in `LookerEmbedSDK.init()`.

If specified, whenever an embed element is created using just an ID, its embed URL is generated using the type of the element, the provided Looker host, and any provided parameters. For example:

```javascript
LookerEmbedSDK.init('looker.example.com', '/looker_auth')
LookerEmbedSDK.createcreateDashboardWithId(11)
 .build()
```

This will call the /looker_auth endpoint and return a signed SSO URL that can be used to create the embedded content:

```html
src=https://looker.example.com/embed/dashboards/11?sdk=2&embed_host=https://yourhost.example.com
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

A signing helper method `createSignedUrl()` is provided in
[server_utils/auth_utils.ts](blob/master/demo/demo_config.ts). Its usage is as follows:

```javascript
import { createSignedUrl } from './auth_utils'

app.get('/looker_auth', function(req, res) {
  // Authenticate the request is from a valid user here
  const src = req.query.src;
  const host = 'https://looker.example.com'
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

There is a simple demo provided, but because of Looker's attention to security, it requires a bit of setup. It also requires Looker's "Embed Secret". Because the embed secret can grant access to all of your data:

* Do not share your secret with anyone you do not want to have complete access to your instance.

* Do not reset your secret if you already are using it in another context.

* Your code should never store the secret in the web browser.

### Step 1 - Enable Embedding in your Looker instance

(This is documented in more detail [here](https://docs.looker.com/r/sdk/sso-embed))

* Navigate to Admin > *Platform* Embed on your Looker instance. This requires Admin privileges.
* The demo server runs by default at [http://localhost:8080](http://localhost:8080). By adding that address to "Embedded Domain Whitelist" you can enabled the demo to receive messages from Looker.
* Turn on "Embed Authentication"
* In order to view your "Embed Secret" you must reset it. Copy the secret to someplace secure.

### Step 2 - Customize the Demo settings for your Looker instance

* Provide your embed secret to the server. You can do this a couple ways.
  * Set it as `LOOKER_EMBED_SECRET` in your shell environment.
  * Create a file named `.env` in the root of the sdk directory. Add a line to that file: `LOOKER_EMBED_SECRET="YourLookerSecret"`

* Provide your Looker instance host address to the server by either:
  * Setting it as `LOOKER_EMBED_HOST` in your shell environment.
  * Adding `LOOKER_EMBED_HOST="yourinstance.looker.com:yourport"` to the `.env` file.

* Edit the `demo/demo_config.ts` file to be appropriate for the pages you want to embed.

```javascript
// The address of your Looker instance. Required.
export const lookerHost = 'self-signed.looker.com:9999'

// A dashboard that the user can see. Set to 0 to disable dashboard.
export const dashboardId = 1
// A Look that the user can see. Set to 0 to disable look.
export const lookId = 1
```

* Edit the `demo/demo_user.json` file to be appropriate for the type of user you want to embed.

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

#### Node server

* `npm install`
* `npm start`
* The server will print out what host and port it is running on. If it is different than `http://localhost:8080` then you will need to add that to your Embedded Domain Whitelist.

#### Python server

* `npm install`
* `npm run python`
* The server will print out what host and port it is running on.

You may need to `pip install six` to install the Python 2/3 compatibility layer.

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
