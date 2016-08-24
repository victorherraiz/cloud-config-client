"use strict";

const http = require("http");
const URL = require("url");
const ClientRequest = http.ClientRequest;

class Configuration {

    constructor (data) {
        const map = new Map();
        data.propertySources.forEach((properties) => {
            const source = properties.source;
            Object.keys(source).forEach((key) => {
                if (!map.has(key)) {
                    map.set(key, source[key]);
                }
            });
        })
        this._data = data;
        this._map = map;
    }

    getValue (prefix, key) {
        return this._map.get(key ? prefix + "." + key : prefix);
    }

}

function load(config) {
    return new Promise((resolve, reject) => {
        const endpoint = URL.parse(config.endpoint);
        const profiles = config.profiles ? config.profiles.join(",") : "default";
        const label = config.label;
        const app = config.application;
        const path = "/" +
            encodeURIComponent(app) + "/" +
            encodeURIComponent(profiles) +
            label ? "/" + encodeURIComponent(label) : "";
        const req = http.request({
            protocol: endpoint.protocol,
            hostname: endpoint.hostname,
            port: endpoint.port,
            path: path
        }, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error("Invalid response"));
            }
            let response = "";
            res.setEncoding("utf8");
            res.on("data", (data) => {
                response += data;
            });
            res.on("end", () => resolve(new Configuration(JSON.parse(response))));
        });
        req.end();
    });
};

module.exports = { load }
