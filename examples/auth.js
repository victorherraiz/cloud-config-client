'use strict'

const client = require('..')

// Explicit basic auth
const options1 = {
  application: 'demo',
  profiles: ['test', 'timeout'],
  auth: {
    user: 'username',
    pass: 'password'
  }
}

client.load(options1).then((cfg) => {
  console.log(cfg.get('test.users', 'multi.uid'))
  console.log(cfg.toString(2))
}).catch((error) => console.error(error))

// Implicit basic auth
const options2 = {
  endpoint: 'http://user:pass@localhost:8888',
  application: 'demo',
  profiles: ['test', 'timeout']
}

client.load(options2).then((cfg) => {
  console.log(cfg.get('test.users', 'multi.uid'))
  console.log(cfg.toString(2))
}).catch((error) => console.error(error))
