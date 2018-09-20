'use strict'

/**
 * @module CloudConfigClient
 */

const http = require('http')
const https = require('https')
const URL = require('url')
const DEFAULT_URL = URL.parse('http://localhost:8888')
const Config = require('./lib/config')

/**
 * Client auth configuration
 *
 * @typedef {Object} Auth
 * @property {string} user - user id.
 * @property {string} pass - user password.
 */

/**
 * Client configuration
 *
 * @typedef {Object} Options
 * @property {string} [endpoint=http://localhost:8888] - spring config service url
 * @property {boolean} [rejectUnauthorized=true] - if false accepts self-signed certificates
 * @property {string} [application] - <b>deprecated</b> use name
 * @property {string} name - application id
 * @property {(string|string[])} [profiles="default"] - application profiles (e.g. ["test", "timeout"] or "test,timeout")
 * @property {string} [label] - environment id
 * @property {module:CloudConfigClient~Auth} [auth] - auth configuration
 * @property {http.Agent|https.Agent} [agent] - Agent for the request. (e.g. use a proxy) (Since version 1.2.0)
 * @property {object} [context] - Context for substitution (see context section below) (Since version 1.4.0)
 */

/**
 * Handle load response
 *
 * @callback loadCallback
 * @param {?Error} error - whether there was an error retrieving configurations
 * @param {module:Config~Config} config - configuration object instance
 */

/**
 * Retrieve basic auth from options
 *
 * Priority:
 * 1. Defined in options
 * 2. Coded as basic auth in url
 *
 * @param {module:CloudConfigClient~Auth} auth - auth configuration.
 * @param {URL} url - endpoint.
 * @returns {string} basic auth.
 */
function getAuth (auth, url) {
  if (auth && auth.user && auth.pass) {
    return auth.user + ':' + auth.pass
  }
  return url.auth
}

/**
 * Build profile string from options value
 *
 * @param {(string|string[])} [profiles] - list of profiles, if none specified will use 'default'
 */
function buildProfilesString (profiles) {
  if (!profiles) {
    return 'default'
  }
  if (Array.isArray(profiles)) {
    return profiles.join(',')
  }
  return profiles
}

/**
 * Build spring config endpoint path
 *
 * @param {string} path - host base path
 * @param {string} name - application name
 * @param {(string|string[])} [profiles] - list of profiles, if none specified will use 'default'
 * @param {string} [label] - environment id
 * @returns {string} spring config endpoint
 */
function getPath (path, name, profiles, label) {
  const profilesStr = buildProfilesString(profiles)

  return (path.endsWith('/') ? path : path + '/') +
        encodeURIComponent(name) + '/' +
        encodeURIComponent(profilesStr) +
        (label ? '/' + encodeURIComponent(label) : '')
}


function fetchAccessToken (clientId, clientSecret, tokenEndpoint, callback) {
  // get the access token
  const endpoint = URL.parse(tokenEndpoint)
  const client = endpoint.protocol === 'https:' ? https : http
  const grantType = 'client_credentials'

  const grantReqContent = 'client_id=' + encodeURIComponent(clientId) + '&client_secret=' + encodeURIComponent(clientSecret) + '&grant_type=' + grantType
  const tokenRequest = client.request({
    protocol: endpoint.protocol,
    hostname: endpoint.hostname,
    path: endpoint.path,
    port: endpoint.port,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(grantReqContent)
    }},
  (res) => {
    if (res.statusCode !== 200) { // OK
      res.resume() // it consumes response
      return callback(new Error('Invalid response: ' + res.statusCode))
    }
    let response = ''
    res.setEncoding('utf8')
    res.on('data', (data) => {
      response += data
    })
    res.on('end', () => {
      try {
        const grant = JSON.parse(response)
        callback(null, grant)
      } catch (e) {
        callback(e)
      }
    })
  })

  tokenRequest.write(grantReqContent);
  return tokenRequest.end()
}

/**
 * Load configuration with callback
 *
 * @param {module:CloudConfigClient~Options} options - spring client configuration options
 * @param {module:CloudConfigClient~loadCallback} [callback] - (load) callback
 */
function loadWithCallback (options, callback) {
  const endpoint = options.endpoint ? URL.parse(options.endpoint) : DEFAULT_URL
  const name = options.name || options.application
  const context = options.context
  const client = endpoint.protocol === 'https:' ? https : http

  client.request({
    protocol: endpoint.protocol,
    hostname: endpoint.hostname,
    port: endpoint.port,
    path: getPath(endpoint.path, name, options.profiles, options.label),
    auth: getAuth(options.auth, endpoint),
    rejectUnauthorized: options.rejectUnauthorized !== false,
    agent: options.agent,
    headers: options.token ? { Authorization: "Bearer " + options.token }: {}
  }, (res) => {
    if (res.statusCode !== 200) { // OK
      res.resume() // it consumes response
      return callback(new Error('Invalid response: ' + res.statusCode))
    }
    let response = ''
    res.setEncoding('utf8')
    res.on('data', (data) => {
      response += data
    })
    res.on('end', () => {
      try {
        const body = JSON.parse(response)
        callback(null, new Config(body, context))
      } catch (e) {
        callback(e)
      }
    })
  }).on('error', callback).end()

}

/**
 * Wrap loadWithCallback with Promise
 *
 * @param {module:CloudConfigClient~Options} options - spring client configuration options
 * @returns {Promise<module:Config~Config, Error>} promise handler
 */
function loadWithPromise (options) {
  return new Promise((resolve, reject) => {
    loadWithCallback(options, (error, config) => {
      if (error) {
        reject(error)
      } else {
        resolve(config)
      }
    })
  })
}


function loadConfig(options, callback) {
  return typeof callback === 'function'
    ? loadWithCallback(options, callback)
    : loadWithPromise(options)
}

module.exports = {
  /**
     * Retrieve properties from Spring Cloud config service
     *
     * @param {module:CloudConfigClient~Options} options - spring client configuration options
     * @param {module:CloudConfigClient~loadCallback} [callback] - load callback
     * @returns {Promise<module:Config~Config, Error>|void} promise handler or void if callback was not defined
     *
     * @since 1.0.0
     */
  load (options, callback) {

  if (options.client_id && options.client_secret && options.access_token_uri) {
    return new Promise((resolve, reject) => {
        fetchAccessToken(options.client_id, options.client_secret, options.access_token_uri,
          (error, grant) => {
            if (error) {
              reject(error)
            } else {
              resolve(grant)
            }
          }
        );
      }).then( ( grant ) => {
        options.token = grant.access_token;
        return loadConfig(options,callback);
      })

    } else {
      return loadConfig(options,callback);
    }
  }
}
