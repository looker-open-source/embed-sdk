require('dotenv').config();

module.exports = {
  host: process.env.LOOKER_EMBED_HOST || 'localhost:9999',
  domain: process.env.LOOKER_EMBED_DOMAIN || 'localhost:8080',
  secret: process.env.LOOKER_EMBED_SECRET || 'ranger2'
}
