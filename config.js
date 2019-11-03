require('dotenv').config();

module.exports = {
  host: process.env.LOOKER_EMBED_HOST || 'self-signed.looker.com:9999',
  secret: process.env.LOOKER_EMBED_SECRET,
  demo_host: process.env.LOOKER_DEMO_HOST || 'localhost',
  demo_port: process.env.LOOKER_DEMO_PORT || 8080,
}
