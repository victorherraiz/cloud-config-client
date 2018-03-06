'use strict'

const client = require('..')
const options = {
  application: 'demo',
  profiles: ['test', 'timeout']
}

// Using promise
client.load(options).then((cfg) => {
  console.log(cfg.get('test.users', 'multi.uid'))
  console.log(cfg.toString(2))
}).catch((error) => console.error(error))

// Using callback
client.load(options, (error, cfg) => {
  if (error) {
    return console.error(error)
  }
  console.log(cfg.get('test.users', 'multi.uid'))
  console.log(cfg.toString(2))
})
