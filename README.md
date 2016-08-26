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
const Client = require("cloud-config-client");
Client.load({
	application: "invoices"
}).then((config) => {
	// Look for a key
	const value1 = config.get("this.is.a.key");

	// Using a prefix, this is equivalent to .get("this.is.another.key");
	const value2 = config.get("this.is", "another.key");
});

```

### Client `load` options

* `endpoint` (string, optional, default: `http://localhost:8888`): Config server URL
* `application` (string, mandatory): Load configuration for this app
* `profiles` (string array, optional, default: `["default"]`)
* `label` (string, optional, default: `null`)


References
----------

* [Spring Cloud Config](http://cloud.spring.io/spring-cloud-config/)

