const JSDOMEnvironment = require('jest-environment-jsdom').default

module.exports = class JSDOMEnvironmentGlobal extends JSDOMEnvironment {
  constructor(...args) {
    super(...args)
    // this.global.jsdom = this.dom
    this.global.fetch = fetch
  }
}
