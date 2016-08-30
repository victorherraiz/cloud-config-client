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

    const promise = client.load(options);
    // or
    client.load(options, function(error, cfg) { ... });

Parameters:

* options (object, mandatory):
    * `endpoint` (string, optional, default: `http://localhost:8888`): Config server URL
    * `application` (string, mandatory): Load configuration for this app
    * `profiles` (string array, optional, default: `["default"]`)
    * `label` (string, optional, default: `null`)
* cb (function, optional): node style callback, if missing the method will return a promise.

Returns a configuration object, use `get` method to query values.

References
----------

* [Spring Cloud Config](http://cloud.spring.io/spring-cloud-config/)

