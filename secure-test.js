"use strict";

const Client = require(".");
const https = require("https");
const assert = require("assert");
const PORT = 15025;
const ENDPOINT = "https://localhost:" + PORT;
const AUTH = "Basic dXNlcm5hbWU6cGFzc3dvcmQ=";

var options = {
  key: fs.readFileSync('./test/fixtures/keys/agent2-key.pem'),
  cert: fs.readFileSync('./test/fixtures/keys/agent2-cert.pem')
};

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

let lastURL = null;
let lastHeaders = null;

const server = https.createServer(options, (req, res) => {
    lastURL = req.url;
    lastHeaders = req.headers;
    res.end(JSON.stringify(DATA));
});

server.on("clientError", (err, socket) => {
  socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

function basicTest() {
    return Client.load({
        endpoint: ENDPOINT,
        profiles: ["test", "timeout"],
        name: "application",
        insecure : true
    }).then((config) => {
        assert.strictEqual(lastURL, "/application/test%2Ctimeout");
        assert.strictEqual(config.get("key01"), "value01");
        assert.strictEqual(config.get("key02"), 2);
        assert.strictEqual(config.get("key03"), null);
        assert.strictEqual(config.get("missing"), undefined);
        assert.strictEqual(config.get("key04.key01"), 42);
        assert.strictEqual(config.get("key04", "key01"), 42);
    });
}

function deprecatedTest() {
    return Client.load({
        endpoint: ENDPOINT,
        profiles: ["test", "timeout"],
        application: "application",
        insecure : true
    }).then((config) => {
        assert.strictEqual(lastURL, "/application/test%2Ctimeout");
    });
}

function explicitAuth() {
    return Client.load({
        endpoint: ENDPOINT,
        application: "application",
        insecure : true,
        auth: { user: "username", pass: "password" }
    }).then((config) => {
        assert.strictEqual(lastHeaders.authorization, AUTH);
        assert.strictEqual(lastURL, "/application/default");
        assert.strictEqual(config.get("key02"), 2);
    });
}

function implicitAuth() {
    return Client.load({
        endpoint: "https://username:password@localhost:" + PORT,
        insecure : true,
        application: "application"
    }).then((config) => {
        assert.strictEqual(lastHeaders.authorization, AUTH);
        assert.strictEqual(lastURL, "/application/default");
        assert.strictEqual(config.get("key02"), 2);
    });
}

function labelTest() {
    return Client.load({
        endpoint: ENDPOINT,
        application: "application",
        insecure : true,
        label: "develop"
    }).then((config) => {
        assert.strictEqual(lastURL, "/application/default/develop");
        assert.strictEqual(config.get("key02"), 2);
    });
}

function forEachTest() {
    return Client.load({
        endpoint: ENDPOINT,
        profiles: ["test", "timeout"],
        insecure : true,
        name: "application"
    }).then((config) => {
        let counter = 0;
        config.forEach((key, value) => counter++);
        assert.strictEqual(counter, 4);
        counter = 0;
        config.forEach((key, value) => counter++, true);
        assert.strictEqual(counter, 5);
    });
}

function contextPathTest() {
    return Client.load({
        endpoint: ENDPOINT + "/justapath",
        name: "mightyapp",
        insecure : true
    }).then((config) => {
        assert.strictEqual(lastURL, "/justapath/mightyapp/default");
    });
}

server.listen(PORT, () => {
    Promise.resolve()
    .then(basicTest)
    .then(deprecatedTest)
    .then(explicitAuth)
    .then(implicitAuth)
    .then(labelTest)
    .then(forEachTest)
    .then(contextPathTest)
    .then(() => console.log("OK :D"))
    .catch((e) => {
        console.error(e);
        process.exitCode = 1;
    }).then(() => {
        server.close();
    });
});