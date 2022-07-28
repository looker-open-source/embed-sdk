// The address of your Looker instance. Required.
// If your instance uses a default port (https://mycompany.looker.com) then
// you should not include a port number here

export const lookerHost = 'self-signed.looker.com:9999'
// export const lookerHost = 'mycompany.looker.com'

// A dashboard that the user can see. Set to 0 to disable dashboard demo.
export const dashboardId = 21

// A Look that the user can see. Set to 0 to disable look demo.
export const lookId = 0

// An Explore that the user can see. Set to '' to disable explore demo.
// export const exploreId = 'thelook::products'
export const exploreId = ''

// An Extension that the user can see. Set to '' to disable extension demo.
// export const extensionId = 'extension::my-great-extension'
// Requires Looker 7.12 and extensions framework.
export const extensionId = ''

// Demo new cookieless embed (new cookieless embed is not backward compatible)
export const cookielessEmbedV2 = true
