require('dotenv').config()

module.exports = {
  host:
    process.env.LOOKER_WEB_URL ||
    process.env.LOOKER_EMBED_HOST ||
    'self-signed.looker.com:9999',
  api_url:
    process.env.LOOKER_API_URL ||
    process.env.LOOKER_EMBED_API_URL ||
    'https://self-signed.looker.com:19999',
  secret: process.env.LOOKER_EMBED_SECRET,
  demo_host: process.env.LOOKER_DEMO_HOST || 'localhost',
  demo_port: process.env.LOOKER_DEMO_PORT || 8080,
  demo_protocol: process.env.LOOKER_DEMO_PROTOCOL || 'http',
  client_id: process.env.LOOKER_CLIENT_ID,
  client_secret: process.env.LOOKER_CLIENT_SECRET,
  verify_ssl: process.env.LOOKER_VERIFY_SSL === 'true' || false,
  use_embed_domain:
    process.env.LOOKER_USE_EMBED_DOMAIN?.toLowerCase() === 'true' || false,
  cookie_secret: (process.env.COOKIE_SECRET || 'secret').padEnd(
    32,
    'ABCDEFGHIJKLMNOPQRSTUVWZYZ0123456'
  ),
}
