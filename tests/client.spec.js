'use strict'

const { describe, it, before, after } = require('mocha')
const Client = require('..')
const { equal, deepEqual, ok, rejects } = require('assert').strict
const AUTH = 'Basic dXNlcm5hbWU6cGFzc3dvcmQ='
const { DATA, COMPLEX_DATA_1, COMPLEX_DATA_2, SUBSTITUTION, OVERLAPPING_LISTS } =
  require('./fixtures.json')

let lastURL = null
let lastHeaders = null

function basicAssertions (config) {
  equal(lastURL, '/application/test%2Ctimeout')
  equal(config.get('key01'), 'value01')
  equal(config.get('key02'), 2)
  equal(config.get('key03'), null)
  equal(config.get('missing'), undefined)
  equal(config.get('key04.key01'), 42)
  equal(config.get('key04', 'key01'), 42)
}

describe('Spring Cloud Configuration Node Client', function () {
  describe('HTTP Server', function () {
    const http = require('http')
    const port = 15023
    const endpoint = 'http://localhost:' + port
    let server

    before('start http server', function (done) {
      server = http.createServer((req, res) => {
        lastURL = req.url
        lastHeaders = req.headers
        if (lastURL.startsWith('/complex_data1')) {
          res.end(JSON.stringify(COMPLEX_DATA_1))
        } else if (lastURL.startsWith('/complex_data2')) {
          res.end(JSON.stringify(COMPLEX_DATA_2))
        } else if (lastURL.startsWith('/substitution')) {
          res.end(JSON.stringify(SUBSTITUTION))
        } else if (lastURL.startsWith('/overlapping_lists')) {
          res.end(JSON.stringify(OVERLAPPING_LISTS))
        } else res.end(JSON.stringify(DATA))
      }).listen(port, done)
      server.on('clientError', (err, socket) => {
        console.error(err)
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
      })
    })

    after('stop http server', function (done) {
      server.close(done)
    })

    it('supports basic call', async function () {
      basicAssertions(await Client.load({
        endpoint,
        profiles: ['test', 'timeout'],
        name: 'application'
      }))
    })

    it('supports provide profiles as a string', async function () {
      basicAssertions(await Client.load({
        endpoint,
        profiles: 'test,timeout',
        name: 'application'
      }))
    })

    it('understands application parameter (DEPRECATED)', async function () {
      await Client.load({
        endpoint,
        profiles: ['test', 'timeout'],
        application: 'application'
      })
      equal(lastURL, '/application/test%2Ctimeout')
    })

    it('supports explicit auth (auth option)', async function () {
      const config = await Client.load({
        endpoint,
        name: 'application',
        auth: { user: 'username', pass: 'password' }
      })
      equal(lastHeaders.authorization, AUTH)
      equal(lastURL, '/application/default')
      equal(config.get('key02'), 2)
    })

    it('do not send auth header', async function () {
      await Client.load({
        endpoint,
        name: 'application'
      })
      equal(lastHeaders.authorization, undefined)
    })

    it('supports implicit auth (endpoint option)', async function () {
      const config = await Client.load({
        endpoint: 'http://username:password@localhost:' + port,
        name: 'application'
      })
      equal(lastHeaders.authorization, AUTH)
      equal(lastURL, '/application/default')
      equal(config.get('key02'), 2)
    })

    it('supports label property to get config by environment', async function () {
      const config = await Client.load({
        endpoint,
        name: 'application',
        label: 'develop'
      })
      equal(lastURL, '/application/default/develop')
      equal(config.get('key02'), 2)
    })

    it('supports custom endpoint path', async function () {
      await Client.load({
        endpoint: endpoint + '/justapath',
        name: 'mightyapp'
      })
      equal(lastURL, '/justapath/mightyapp/default')
    })

    it('returns a config with raw property', async function () {
      const { raw } = await Client.load({
        endpoint,
        profiles: ['test', 'timeout'],
        name: 'application'
      })
      deepEqual(raw, DATA)
    })

    describe('CloudConfigClient', function () {
      describe('`properties` prop', function () {
        it('take key value from more specific propertySources ignoring less specific', async function () {
          const config = await Client.load({
            endpoint,
            profiles: ['test', 'timeout'],
            name: 'application'
          })

          const overriddenKey = 'key01'
          const overriddenValues = []
          DATA.propertySources.forEach(({ source }) => {
            if (overriddenKey in source) {
              overriddenValues.push(source[overriddenKey])
            }
          }, true)

          equal(overriddenValues.length, 2)
          const expected = {
            'key04.key01': 42,
            key01: overriddenValues[0],
            key02: 2,
            key03: null
          }
          deepEqual(config.properties, expected)
        })
      })

      describe('`raw` prop', function () {
        it('contains raw data from Spring Cloud Config', async function () {
          const config = await Client.load({
            endpoint,
            profiles: ['test', 'timeout'],
            name: 'application'
          })

          deepEqual(config.raw, DATA)
        })
      })

      describe('forEach method', function () {
        it('iterates over distinct configuration properties by default', async function () {
          const config = await Client.load({
            endpoint,
            profiles: ['test', 'timeout'],
            name: 'application'
          })
          let counter = 0
          const uniqueKeys = new Set()
          config.forEach((key) => {
            uniqueKeys.add(key)
            counter++
          })

          equal(uniqueKeys.size, 4)
          equal(counter, 4)
        })

        it('iterates over overridden configuration properties if second param set to `true`', async function () {
          const config = await Client.load({
            endpoint,
            profiles: ['test', 'timeout'],
            name: 'application'
          })
          let counter = 0
          const uniqueKeys = new Set()
          config.forEach((key) => {
            uniqueKeys.add(key)
            counter++
          }, true)

          equal(uniqueKeys.size, 4)
          equal(counter, 5)
        })
      })

      describe('get method', function () {
        it('returns value of the given key from the most specific property source', async function () {
          const config = await Client.load({
            endpoint,
            profiles: ['test', 'timeout'],
            name: 'application'
          })

          const overriddenKey = 'key01'
          const overriddenValues = []
          DATA.propertySources.forEach(({ source }) => {
            if (overriddenKey in source) {
              overriddenValues.push(source[overriddenKey])
            }
          }, true)

          equal(overriddenValues.length, 2)
          // the most specific value goes first in the list of all values of the same key
          equal(config.get(overriddenKey), overriddenValues[0])
          equal(config.get('key02'), 2)
        })
      })

      describe('toObject method', function () {
        it('responses with JS object with all the unique keys from properties', async function () {
          const config = await Client.load({
            endpoint,
            profiles: ['test'],
            name: 'complex_data1'
          })
          deepEqual(config.toObject(), {
            key01: 'value01',
            key02: null,
            key03: { key01: [1, { data: 2 }], key02: 3 },
            key04: { key01: 42 }
          })
        })

        it('processes nested structures correctly', async function () {
          const config = await Client.load({
            endpoint,
            profiles: ['test'],
            name: 'complex_data2'
          })
          deepEqual(config.toObject(), { data: { key01: [[1, 3], [4, 5]] } })
        })

        it('merges arrays if less specific property resource contains same key with bigger array', async function () {
          const config = await Client.load({
            endpoint,
            profiles: ['test', 'timeout'],
            name: 'overlapping_lists'
          })

          const objConfig = config.toObject({ merge: true })

          deepEqual(objConfig.key01, ['four', 'two', 'three'])
          deepEqual(objConfig.key02, [1, 2, 3])
          deepEqual(objConfig.key03, [1, 2])
          deepEqual(objConfig.key05, [[100, 101], [200, 80]])
        })

        it('replaces less specific arrays if option `merge` is set to `false`', async function () {
          const config = await Client.load({
            endpoint,
            profiles: ['test', 'timeout'],
            name: 'overlapping_lists'
          })

          const objConfig = config.toObject({ merge: false })

          deepEqual(objConfig.key01, ['four'])
          deepEqual(objConfig.key02, [1, 2, 3])
          deepEqual(objConfig.key03, [1, 2])
          deepEqual(objConfig.key05, [[100, 101], [200]])

          deepEqual(config.toObject(), objConfig)
        })
      })
    })

    it('replaces references with a context object', async function () {
      const expectation = {
        key01: 'Hello',
        key03: 42,
        key04: 'Javier',
        key05: 'Javier-SecretWord',
        key06: false,
        key07: null,
        key08: 'super.password',
        key09: '${MISSING_KEY}' // eslint-disable-line
      }
      const context = { MY_USERNAME: 'Javier', MY_PASSWORD: 'SecretWord' }
      const config = await Client
        .load({ endpoint, name: 'substitution', context })
      deepEqual(config.toObject(), expectation)
    })
  })

  describe('HTTPS Server', function () {
    const fs = require('fs')
    const https = require('https')
    const port = 15024
    const endpoint = 'https://localhost:' + port

    before('start https server', function (done) {
      this.server = https.createServer({
        key: fs.readFileSync('tests/key.pem'),
        cert: fs.readFileSync('tests/cert.pem')
      }, (req, res) => {
        lastURL = req.url
        lastHeaders = req.headers
        res.end(JSON.stringify(DATA))
      }).listen(port, done)
    })

    after('stop https server', function (done) {
      this.server.close(done)
    })

    it('works as expected', async function () {
      basicAssertions(await Client.load({
        endpoint,
        rejectUnauthorized: false,
        profiles: ['test', 'timeout'],
        name: 'application'
      }))
    }
    )

    it('rejects the connection if not authorized', async function () {
      await rejects(() => Client.load({
        endpoint,
        profiles: ['test', 'timeout'],
        name: 'application'
      }))
    })

    it('supports calls via proxy agent', async function () {
      const agent = new https.Agent()
      const old = agent.createConnection.bind(agent)
      let used = false
      agent.createConnection = function (options, callback) {
        used = true
        return old(options, callback)
      }
      const config = await Client.load({
        endpoint,
        rejectUnauthorized: false,
        profiles: ['test', 'timeout'],
        name: 'application',
        agent
      })
      basicAssertions(config)
      ok(used, 'Agent must be used in the call')
      agent.destroy()
    })
  })
})
