'use strict'

const { describe, it, before, after } = require('mocha')
const Client = require('..')
const http = require('http')
const https = require('https')
const nock = require('nock')
const fs = require('fs')
const { equal, deepEqual, ok, rejects } = require('assert').strict
const PORT = 15023
const HTTPS_PORT = PORT + 1
const ENDPOINT = 'http://localhost:' + PORT
const HTTPS_ENDPOINT = 'https://localhost:' + HTTPS_PORT
const AUTH = 'Basic dXNlcm5hbWU6cGFzc3dvcmQ='

const DATA = {
  propertySources: [{
    source: {
      key01: 'value01',
      key03: null,
      'key04.key01': 42
    }
  }, {
    source: {
      key01: 'banana',
      key02: 2
    }
  }]
}

const COMPLEX_DATA_1 = {
  propertySources: [{
    source: {
      key01: 'value01',
      key02: null,
      'key03.key01[0]': 1,
      'key03.key01[1].data': 2,
      'key03.key02': 3,
      'key04.key01': 42
    }
  }]
}
const COMPLEX_DATA_2 = {
  propertySources: [
    {
      source: {
        'data.key01[0][0]': 1,
        'data.key01[0][1]': 3,
        'data.key01[1][0]': 4,
        'data.key01[1][1]': 5
      }
    }
  ]
}

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

async function basicTest () {
  basicAssertions(await Client.load({
    endpoint: ENDPOINT,
    profiles: ['test', 'timeout'],
    name: 'application'
  }))
}

async function basicStringProfileTest () {
  basicAssertions(await Client.load({
    endpoint: ENDPOINT,
    profiles: 'test,timeout',
    name: 'application'
  }))
}

async function deprecatedTest () {
  await Client.load({
    endpoint: ENDPOINT,
    profiles: ['test', 'timeout'],
    application: 'application'
  })
  equal(lastURL, '/application/test%2Ctimeout')
}

async function explicitAuth () {
  const config = await Client.load({
    endpoint: ENDPOINT,
    application: 'application',
    auth: { user: 'username', pass: 'password' }
  })
  equal(lastHeaders.authorization, AUTH)
  equal(lastURL, '/application/default')
  equal(config.get('key02'), 2)
}

async function implicitAuth () {
  const config = await Client.load({
    endpoint: 'http://username:password@localhost:' + PORT,
    application: 'application'
  })
  equal(lastHeaders.authorization, AUTH)
  equal(lastURL, '/application/default')
  equal(config.get('key02'), 2)
}

async function labelTest () {
  const config = await Client.load({
    endpoint: ENDPOINT,
    application: 'application',
    label: 'develop'
  })
  equal(lastURL, '/application/default/develop')
  equal(config.get('key02'), 2)
}

async function forEachTest () {
  const config = await Client.load({
    endpoint: ENDPOINT,
    profiles: ['test', 'timeout'],
    name: 'application'
  })
  let counter = 0
  config.forEach((key, value) => counter++)
  equal(counter, 4)
  counter = 0
  config.forEach((key, value) => counter++, true)
  equal(counter, 5)
}

async function contextPathTest () {
  await Client.load({
    endpoint: ENDPOINT + '/justapath',
    name: 'mightyapp'
  })
  equal(lastURL, '/justapath/mightyapp/default')
}

async function propertiesTest () {
  const { properties } = await Client.load({
    endpoint: ENDPOINT,
    profiles: ['test', 'timeout'],
    name: 'application'
  })
  const expected = {
    key01: 'value01',
    key02: 2,
    key03: null,
    'key04.key01': 42
  }
  deepEqual(properties, expected)
}

async function rawTest () {
  const { raw } = await Client.load({
    endpoint: ENDPOINT,
    profiles: ['test', 'timeout'],
    name: 'application'
  })
  deepEqual(raw, DATA)
}

async function toObjectTest1 () {
  const config = await Client.load({
    endpoint: ENDPOINT,
    profiles: ['test'],
    name: 'complex_data1'
  })
  deepEqual(config.toObject(), {
    key01: 'value01',
    key02: null,
    key03: { key01: [1, { data: 2 }], key02: 3 },
    key04: { key01: 42 }
  })
}

async function toObjectTest2 () {
  const config = await Client.load({
    endpoint: ENDPOINT,
    profiles: ['test'],
    name: 'complex_data2'
  })
  deepEqual(config.toObject(), { data: { key01: [[1, 3], [4, 5]] } })
}

describe('Spring Cloud Configuration Node Client', function () {
  describe('HTTP Server', function () {
    before('start http server', function (done) {
      this.server = http.createServer((req, res) => {
        lastURL = req.url
        lastHeaders = req.headers
        if (lastURL.startsWith('/complex_data1')) {
          res.end(JSON.stringify(COMPLEX_DATA_1))
        } else if (lastURL.startsWith('/complex_data2')) {
          res.end(JSON.stringify(COMPLEX_DATA_2))
        } else res.end(JSON.stringify(DATA))
      }).listen(PORT, done)
      this.server.on('clientError', (err, socket) => {
        console.error(err)
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
      })
    })

    after('stop http server', function (done) {
      this.server.close(done)
    })

    it('Test migration - http', async function () {
      // TODO move to promise all
      await basicTest()
      await basicStringProfileTest()
      await deprecatedTest()
      await explicitAuth()
      await implicitAuth()
      await labelTest()
      await forEachTest()
      await contextPathTest()
      await propertiesTest()
      await rawTest()
      await toObjectTest1()
      await toObjectTest2()
    })
    it('replaces references with a context object', async function () {
      const source = {
        key01: 'Hello',
        key03: 42,
        key04: '${MY_USERNAME}', // eslint-disable-line
        key05: '${MY_USERNAME}-${MY_PASSWORD}', // eslint-disable-line
        key06: false,
        key07: null,
        key08: '${MY_OLD_PASSWORD:super.password}', // eslint-disable-line
        key09: '${MISSING_KEY}' // eslint-disable-line
      }
      nock(ENDPOINT).get('/application/default')
        .reply(200, { propertySources: [{ source }] })
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
        .load({ endpoint: ENDPOINT, name: 'application', context })
      deepEqual(config.toObject(), expectation)
    })
  })

  describe('HTTPS Server', function () {
    before('start https server', function (done) {
      this.server = https.createServer({
        key: fs.readFileSync('tests/key.pem'),
        cert: fs.readFileSync('tests/cert.pem')
      }, (req, res) => {
        lastURL = req.url
        lastHeaders = req.headers
        res.end(JSON.stringify(DATA))
      }).listen(HTTPS_PORT, done)
    })

    after('stop https server', function (done) {
      this.server.close(done)
    })

    async function httpsSimpleTest () {
      basicAssertions(await Client.load({
        endpoint: HTTPS_ENDPOINT,
        rejectUnauthorized: false,
        profiles: ['test', 'timeout'],
        name: 'application'
      }))
    }

    async function httpsWithAgent () {
      const agent = new https.Agent()
      const old = agent.createConnection.bind(agent)
      let used = false
      agent.createConnection = function (options, callback) {
        used = true
        return old(options, callback)
      }
      const config = await Client.load({
        endpoint: HTTPS_ENDPOINT,
        rejectUnauthorized: false,
        profiles: ['test', 'timeout'],
        name: 'application',
        agent
      })
      basicAssertions(config)
      ok(used, 'Agent must be used in the call')
      agent.destroy()
    }

    async function httpsRejectionTest () {
      rejects(Client.load({
        endpoint: HTTPS_ENDPOINT,
        profiles: ['test', 'timeout'],
        name: 'application'
      }))
    }

    it('Test migration - https', async function () {
      await httpsSimpleTest()
      await httpsRejectionTest()
      await httpsWithAgent()
    })
  })
})
