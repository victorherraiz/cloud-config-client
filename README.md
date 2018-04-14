Spring Cloud Config Client for NodeJS
=====================================

[![Build Status](https://travis-ci.org/victorherraiz/cloud-config-client.svg?branch=master)](https://travis-ci.org/victorherraiz/cloud-config-client)

Requires: NodeJS 4+

Feature requests are welcome.


Install
-------

    npm install cloud-config-client --save


Usage
-----

```js
const client = require("cloud-config-client");
client.load({
    application: "invoices"
}).then((config) => {
    // Look for a key
    const value1 = config.get("this.is.a.key");

    // Using a prefix, this is equivalent to .get("this.is.another.key");
    const value2 = config.get("this.is", "another.key");
});

```

### `load` function

[Load implementation](./index.js)

#### Parameters

* options - `Object`, mandatory:
  * endpoint `string`, optional, default=`http://localhost:8888`: Config server URL.
  * rejectUnauthorized - `boolean`, optional, default = `true`: if `false` accepts self-signed certificates
  * application - `string`, **deprecated, use name**: Load configuration for this application.
  * name - `string`, mandatory: Load the configuration with this name.
  * profiles `string|string[]`, optional, default=`"default"`: Load profiles.
  * label - `string`, optional: Load environment.
  * auth - `Object`, optional: Basic Authentication for access config server (e.g.: `{ user: "username", pass: "password"}`).
    _endpoint_ accepts also basic auth (e.g. `http://user:pass@localhost:8888`).
    * user - `string`, mandatory
    * pass - `string`, mandatory
  * agent - `http.Agent|https.Agent`, optional: Agent for the request.
* callback - `function(error: Error, config: Config)`, optional: node style callback. If missing, the method will return a promise.

```js
client.load(options)
.then((config) => { ... })
.catch((error) => { ... })

// or

client.load(options, (error, config) => { ... })

// or

async function foo () {
    const config = await client.load(options)
    //...
}

```

### `Config` object

[Config class implementation](./lib/config.js)

#### Properties

* `raw`: Spring raw response data.
* `properties`: computed properties as per Spring specification:
  > Property keys in more specifically named files override those in application.properties or application.yml.

#### Methods

* `get(...parts)`: Retrieve a value at a given path or undefined. Multiple parameters can be used to calculate the key.
    * parts - `string`, variable, mandatory:
* `forEach(callback, includeOverridden)`: Iterate over every key/value in the config.
    * callback - `function(key: string, value: string)`, mandatory: iteration callback.
    * includeOverridden - `boolean`, optional, default=`false`: if true, include overridden keys.
* `toString(spaces): string`: Return a string representation of `raw` property.
    * spaces - `number`, optional: spaces to use in format.

```js
config.get("this.is.a.key");
config.get("this.is", "a.key");
config.get("this", "is", "a", "key");

config.forEach((key, value) => console.log(key + ":" + value));
```


References
----------

* [Spring Cloud Config](http://cloud.spring.io/spring-cloud-config/)

