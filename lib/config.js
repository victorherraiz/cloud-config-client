'use strict'

/**
 * @module Config
 */

/**
 * Retrieve sources from configuration files.
 *
 * @param {module:Spring~ConfigData} data - spring response data.
 * @return {Array<module:Spring~ConfigSource>} list of sources.
 */
function getSources (data) {
  return data.propertySources.map((file) => file.source)
}

function updateCurrent (current, name, indexes, value) {
  if (indexes.length) {
    if (!current[name]) current[name] = []
    current = current[name]
    for (const index of indexes.slice(0, -1)) {
      if (!current[index]) current[index] = []
      current = current[index]
    }
    const last = indexes[indexes.length - 1]
    if (!current[last]) current[last] = value
    return current[last]
  } else if (name) {
    if (!current[name]) current[name] = value
    return current[name]
  }
  return current
}

const keyRE = /^(\S+?)(?:\[\d+\])+$/
const indexesRE = /\[\d+\]/g

function toObject (properties) {
  const obj = {}
  for (const key of Object.keys(properties)) {
    let current = obj
    let name = null
    let indexes = []
    for (const item of key.split('.')) {
      current = updateCurrent(current, name, indexes, {})
      const match = keyRE.exec(item)
      if (match) {
        name = match[1]
        indexes = item.match(indexesRE)
          .map(str => Number.parseInt(str.slice(1, -1), 10))
      } else {
        name = item
        indexes = []
      }
    }
    updateCurrent(current, name, indexes, properties[key])
  }
  return obj
}

function replacer (ctx) {
  return (val) => typeof val === 'string' ? val.replace(
    /\$\{(.+?)(?::(.+?))?\}/g,
    (match, group, def) => ctx[group] || def || match) : val
}
/**
 * Configuration handler
 * @class
 */
class Config {
  /**
   * Function to apply to every property in configuration
   *
   * @callback forEachFunc
   * @param {string} key - property key
   * @param {*} value - property value
   */

  /**
   * Create config object.
   *
   * @param {module:Spring~ConfigData} data - spring response data
   */
  constructor (data, context) {
    this._raw = data
    const properties = getSources(this._raw).reduce((accum, value) => Object.assign({}, value, accum), {})
    if (context) {
      const rep = replacer(context)
      this._properties = Object.keys(properties).reduce((acc, key) => {
        acc[key] = rep(acc[key])
        return acc
      }, properties)
    } else {
      this._properties = properties
    }
  }

  /**
   * Computed configuration properties
   *
   * @type {module:Spring~ConfigSource}
   *
   * @since 1.0.0
   */
  get properties () {
    return Object.assign({}, this._properties)
  }

  /**
   * Raw spring response data
   *
   * @type {module:Spring~ConfigData}
   *
   * @since 1.0.0
   */
  get raw () {
    return JSON.parse(JSON.stringify(this._raw))
  }

  /**
   * Retrieve a configuration property by key
   *
   * @param {...string} keyParts - parts to join as key
   * @return {*} property value
   *
   * @since 1.0.0
   */
  get (keyParts) {
    const key = Array.prototype.slice.call(arguments).join('.')

    return this._properties[key]
  }

  /**
   * Iterate over configuration properties
   *
   * @param {module:Config~forEachFunc} callback - function to apply to every property
   * @param {boolean} [includeOverridden=false] whether to include overridden properties
   *
   * @since 1.0.0
   */
  forEach (callback, includeOverridden) {
    const _include = includeOverridden || false
    const sources = _include ? getSources(this._raw) : [this._properties]

    sources.forEach((source) => {
      for (let prop in source) {
        if (source.hasOwnProperty(prop)) {
          callback(prop, source[prop])
        }
      }
    })
  }

  /**
   * Returns the configuration as an object
   *
   * @return {object} full configuration object
   *
   * @since 1.3.0
   */
  toObject () {
    return toObject(this._properties)
  }

  /**
   * Returns a string representation of raw response data
   *
   * @param {number} [spaces] - number spaces to use in formatting
   * @returns {string} - raw response data as string
   *
   * @since 1.0.0
   */
  toString (spaces) {
    return JSON.stringify(this._raw, null, spaces)
  }
}

module.exports = Config
