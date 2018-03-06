'use strict'

const client = require('..')
const options = {
  endpoint: 'http://localhost:8888/justapath',
  application: 'demo',
  profiles: ['test', 'timeout']
}

// Using promise
client.load(options).then((cfg) => {
  console.log(cfg.get('test.users', 'multi.uid'))
  console.log(cfg.toString(2))
}).catch((error) => console.error(error))
