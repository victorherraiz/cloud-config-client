"use strict";

/**
 * @module Config
 */

const _ = require("lodash");

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
  constructor(data) {
    this._raw = data;
    this._properties = _.map(data.propertySources, "source").reduce(_.defaults, {});
  }

  /**
   * Computed configuration properties
   *
   * @public
   * @type {module:Spring~ConfigSource}
   */
  get properties() {
    return _.cloneDeep(this._properties);
  }


  /**
   * Raw spring response data
   *
   * @public
   * @type {module:Spring~ConfigData}
   */
  get raw() {
    return _.cloneDeep(this._raw);
  }

  /**
   * Retrieve a configuration property by key
   *
   * @public
   * @param {...string} keyParts - parts to join as key
   * @return {*} property value
   */
  get(keyParts) {
    const key = [].slice.call(arguments).filter(String).join('.');

    return _.get(this._properties, key);
  }

  /**
   * Iterate over configuration properties
   *
   * @public
   * @param {module:Config~forEachFunc} callback - function to apply to every property
   * @param {boolean} [includeOverridden=false] whether to include overridden properties
   */
  forEach(callback, includeOverridden) {
    const _include = includeOverridden || false;
    const sources = _include ? _.map(this._raw.propertySources, "source") : [this._properties];

    _.forEach(sources, (source) => _.forEach(source, (value, key) => callback(key, value)));
  }

  /**
   * Returns a string representation of raw response data
   *
   * @public
   * @param {number} spaces - number spaces to use in formatting
   * @returns {string} - raw response data as string
   */
  toString(spaces) {
    return JSON.stringify(this._raw, null, spaces);
  }
}

module.exports = Config;
