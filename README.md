# Looker JavaScript Embed SDK

## Introduction

The Looker JavaScript Embed SDK simplifies using Looker embedded content in your web application. The goal is to make communication between a host website and one or more embedded dashboards, looks or explores easier and more reliable.

A typical setup might look like this. In this case, a dashboard with an id of `11` is created inside a DOM element with the id `dashboard`. The `dashboard:run:start` and `dashboard:run:complete` events are used to update the state of the embedding window's UI, and a button with an id of `run` is scripted to send a `dashboard:run` message to the dashboard.

```javascript
LookerEmbedSDK.init('looker.example.com:443', '/auth')

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

## Using the Looker Embed SDK  

### Web App Setup
The Looker Embed SDK is a JavaScript module that lives and runs in the browser with your web app. 

The demo also includes a reference implementation of the Looker SSO embed URL signature algorithm as a NodeJS web server module. The URL signature is used to secure and authenticate the embed URL request on the Looker server.
 
The instructions and demo web app shown below assume that the Looker Embed SDK is built into your web app using the included webpack build configuration. If your web app doesn't use the webpack stack, you can build the Embed SDK into a javascript module and then reference that module from your web app HTML. 

### Clone the Repo
To build and modify the demo, you should clone [the Looker Embed SDK repository](https://github.com/looker-open-source/embed-sdk) to a directory on your local machine.

### Fluent Call Style
The Looker Embed SDK uses a fluent interface pattern. Each function defined in the SDK returns an object instance or promise so that you can "chain" together a series of operaitons:  
```javascript
  sdk.this(a)
     .that(b)
     .then((data) => the_other(data))
``` 

Construction of embedded content is broken into two phases: building and connecting.

### Building

First initialize the SDK with address of your Looker server and, optionally, the URL of your web server endpoint that will perform SSO embed URL signing.
These are used by all the embedded content.

```javascript
LookerEmbedSDK.init('looker.example.com:443', '/auth')
```

You build embedded content using a series of calls to define its parameters. Some of these parameters are optional, and some are mandatory.

Create a content builder using either an `id` or using an [SSO Embed URL](https://docs.looker.com/r/sdk/sso-embed):

```javascript
LookerEmbedSDK.createDashboardWithId(id)
```

or

```javascript
LookerEmbedSDK.createDashboardWithUrl(url)
```

Use the `id` form when you have initialized the Embed SDK with your authUrl to perform url signing. The Embed SDK will take care of constructing the embed URL to view the Looker content with that `id` and call your auth service to sign the URL.

Use the `url` form when you want to take care of constructing and signing the Embed URL yourself.

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

You finish by building the embedded DOM element:

```javascript
  .build()
```

### Connecting
If you want to send and receive messages between your web app and the embedded Looker content (and you probably do!) you need to call `connect()` which returns a Promise that resolves to the communication interface of the given element:

```javascript
  .connect()
  .then(setupDashboard)
  .catch(console.error)
```

## Building URLs for the SDK

The main documentation for Looker SSO embed URLs is [here](https://docs.looker.com/r/sdk/sso-embed). The only difference when creating URLs for the SDK is that you will need to add an `sdk=2` parameter to the Embed URL alongside other parameters like filters and the `embed_domain` parameter. This `sdk=2` parameter tells Looker that the Embed SDK is resident in your web app, allowing Looker to take advantage of advanced features supported by the Embed SDK that we can't assume all web apps support.

Embed Target URL with required params, to pass to SSO Embed URL signing:
```html
/embed/looks/4?embed_domain=https://mywebsite.com&sdk=2
```

The SDK cannot add this parameter itself because the parameter is part of the signed SSO URL.

## The Auth Endpoint

Because the embed secret needs to be carefully guarded, embed SSO URLs cannot be created in the browser. To make the process easier and secure, you can instead do the following:

1. Implement a URL signing function in your web server. The server should return a signed URL using one of the reference implementation examples documented in the [Looker Embed SSO Examples](https://github.com/looker/looker_embed_sso_examples) Github repository.

2. Pass the URL of your server signing endpoint to the embed SDK in the `authUrl` parameter to `LookerEmbedSDK.init()`.

When you provide an `authUrl` to the Embed SDK, whenever you create an embed element using just an ID, the Embed SDK will construct the embed URL required and send it to the `authUrl` service for signing. For example:

```javascript
LookerEmbedSDK.init('looker.example.com:443', '/looker_auth')
LookerEmbedSDK.createcreateDashboardWithId(11)
 .build()
```

This will call the `/looker_auth` endpoint on your app's web server and return a signed SSO URL to display the indicated Looker content in the embed context:

```html
src=https://looker.example.com:443/embed/dashboards/11?param=data&etc=etc&signature=ADSFWE$WEDASDFWE#WSADS
```

### Node helper

This Embed SDK includes a reference implementation of the required URL signing algorithm in a NodeJS server module. The signing function is `createSignedUrl()` in file
[server_utils/auth_utils.ts](blob/master/demo/demo_config.ts). The nodejs server module calls the signing function like this:

```javascript
import { createSignedUrl } from './auth_utils'

app.get('/looker_auth', function(req, res) {
  // Authenticate the request is from a valid user here
  const src = req.query.src;
  const host = 'http://looker.example.com:443'
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

If NodeJS is not part of your web app server stack, you can port the reference URL signing algorithm to your language and toolset of choice. Check the [Looker SSO Embed Examples](https://github.com/looker/looker_embed_sso_examples) as we (or an OpenSource contributor) may have already ported the signing algorithm to your language!

## Demo

The Embed SDK includes a simple demo app which only requires a few minutes of configuration to get it up and running. 

The first thing you need to do is to create an "embed secret" on your Looker instance. The embed secret is used as a cryptographic key to sign the SSO Embed URL to provide proof to the Looker server that the URL originates from a trusted party and proof that the URL contents were not modified in transit.

The embed URL, secured by the embed secret signature, specifies attributes and permissions to grant to a "synthetic" Looker user account created for the embed session.
Because the embed secret (in the wrong hands) could be used to grant access to all of your data, you need to handle the embed secret very carefully:

* Do not share your embed secret with anyone you do not want to have complete access to your instance.
* Do not reset your embed secret if you already are using it in another context. (Resetting the embed secret destroys the old secret and creates a new one)
* Never store or pass the embed secret to your web app code that runs in the browser.
* Never store your embed secret in source code or in any file that is checked into a code repository (like git or GitHub).

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
