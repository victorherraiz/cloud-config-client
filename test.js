"use strict";

const Client = require(".");
const http = require("http");
const assert = require("assert");
const PORT = 15023;

const DATA = {
    name: "application",
    profiles: [ "default" ],
    label: "master",
    propertySources: [{
        name: "file:///myapp.yml",
        source:  {
            "key01": "value01",
            "key03": null,
            "key04.key01": 42
        }
    }, {
        name: "file:///application.yml",
        source:  {
            "key01": "banana",
            "key02": 2
        }
    }]
};

const server = http.createServer((req, res) => {
  res.end(JSON.stringify(DATA));
});

server.on("clientError", (err, socket) => {
  socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

server.listen(PORT, () => {
    Client.load({
        endpoint: `http://localhost:${PORT}` ,
        application: "application"
    }).then((config) => {
        assert.strictEqual(config.getValue("key01"), "value01");
        assert.strictEqual(config.getValue("key02"), 2);
        assert.strictEqual(config.getValue("key03"), null);
        assert.strictEqual(config.getValue("missing"), undefined);
        assert.strictEqual(config.getValue("key04.key01"), 42);
        assert.strictEqual(config.getValue("key04", "key01"), 42);
        console.log("OK :D");
    }).catch((e) => {
        console.error(e);
        process.exitCode = 1;
    }).then(() => {
        server.close();
    });
});

