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
        },
        toString(spaces) {
            return JSON.stringify(data, null, spaces);
        }
    }
}

function loadWithCallback(options, cb) {
    const endpoint = options.endpoint ? URL.parse(options.endpoint) : DEFAULT_URL;
        const profiles = options.profiles ? options.profiles.join(",") : "default";
        const label = options.label;
        const app = options.application;
        const path = "/" +
            encodeURIComponent(app) + "/" +
            encodeURIComponent(profiles) +
            (label ? "/" + encodeURIComponent(label) : "");
        http.request({
            protocol: endpoint.protocol,
            hostname: endpoint.hostname,
            port: endpoint.port,
            path: path
        }, (res) => {
            if (res.statusCode !== 200) {
                res.resume(); // it consumes response
                return cb(new Error("Invalid response: " + res.statusCode));
            }
            let response = "";
            res.setEncoding("utf8");
            res.on("data", (data) => {
                response += data;
            });
            res.on("end", () => {
                try {
                    const body = JSON.parse(response);
                    cb(null, build(body));
                } catch (e) {
                    cb(e);
                }
            });
        }).on("error", cb).end();
}

function loadWithPromise(options) {
    return new Promise((resolve, reject) => {
        loadWithCallback(options, (error, cfg) => {
            if (error) {
                reject(error);
            } else {
                resolve(cfg);
            }
        });
    });
}

function load(options, cb) {
    return typeof cb === "function" ?
        loadWithCallback(options, cb) :
        loadWithPromise(options);
}

module.exports = { load }
