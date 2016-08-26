"use strict";

const http = require("http");
const URL = require("url");
const ClientRequest = http.ClientRequest;
const DEFAULT_URL = URL.parse("http://localhost:8888");

function build(data) {
    return {
        get (prefix, key) {
            const fk = key ? prefix + "." + key : prefix;
            for (let item of data.propertySources) {
                const value = item.source[fk];
                if (value !== undefined) {
                    return value;
                }
            }
        }
    }
}

function load(config) {
    return new Promise((resolve, reject) => {
        const endpoint = config.endpoint ? URL.parse(config.endpoint) : DEFAULT_URL;
        const profiles = config.profiles ? config.profiles.join(",") : "default";
        const label = config.label;
        const app = config.application;
        const path = "/" +
            encodeURIComponent(app) + "/" +
            encodeURIComponent(profiles) +
            (label ? "/" + encodeURIComponent(label) : "");
        const req = http.request({
            protocol: endpoint.protocol,
            hostname: endpoint.hostname,
            port: endpoint.port,
            path: path
        }, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error("Invalid response: " + res.statusCode));
            }
            let response = "";
            res.setEncoding("utf8");
            res.on("data", (data) => {
                response += data;
            });
            res.on("end", () => resolve(build(JSON.parse(response))));
        });
        req.end();
    });
};

module.exports = { load }
