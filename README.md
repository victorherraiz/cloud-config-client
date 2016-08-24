Spring Cloud Config Client for NodeJS
=====================================

[![Build Status](https://travis-ci.org/victorherraiz/cloud-config-client.svg?branch=master)](https://travis-ci.org/victorherraiz/cloud-config-client)

Requires: NodeJS 4+

Feature request are welcome.

Usage
-----

```js
const Client = require("cloud-config-client");
const config = Client.load({
	endpoint: "http://localhost:8888",
	application: "invoices"
});

// Look for a key
const value1 = config.getValue("this.is.a.key");

// Using a prefix, this is equivalent to .getValue("this.is.another.key");
const value2 = config.getValue("this.is", "another.key");

```

### Client `load` options

* endpoint (string, mandatory): Config server URL
* application (string, mandatory): Load configuration for this app
* profiles (string array, optional, default: ["default"])
* label (string array, optional, default: null)


References
----------

* [Spring cloud config](http://cloud.spring.io/spring-cloud-config/)

