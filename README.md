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

```js
const promise = client.load(options);
// or
client.load(options, function(error, cfg) { ... });
```

Parameters:

* options (object, mandatory):
    * `endpoint` (string, optional, default: `http://localhost:8888`): Config server URL
    * `application` (deprecated: use name): Load configuration for this app
    * `name` (string, mandatory): Load the configuration with this name
    * `profiles` (string array, optional, default: `["default"]`)
    * `label` (string, optional)
    * `auth` (object, optional): Basic Authentication for access config server (e.g.: `{ user: "username", pass: "password"}`). `endpoint` accepts also basic auth (e.g. `http://user:pass@localhost:8888`)
        * `user` (string)
        * `pass` (string)
* cb (function, optional): node style callback, if missing the method will return a promise.

Returns a configuration object, use `get` method to query values and `forEach` to iterate over them.

### `config` object

Methods:

* `get`: return a value from the loaded configuration or null
* `forEach(cb, include)`: Allow you to iterate over every key/value in the config.
    * cb (function): iteration calback
    * include (boolean, default: false): if true, include repeated keys.


```js
config.forEach((key, value) => console.log(key + ":" + value));
```


References
----------

* [Spring Cloud Config](http://cloud.spring.io/spring-cloud-config/)

