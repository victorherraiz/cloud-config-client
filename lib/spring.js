'use strict'

/**
 * @module Spring
 */

/**
 * Alias for configuration properties map
 *
 * @typedef {Map<string, *>} ConfigSource
 */

/**
 * Spring configuration file
 *
 * @typedef {Object} ConfigFile
 * @property {string} name - file name
 * @property {module:Spring~ConfigSource} source - configuration properties
 */

/**
 * Spring configuration response data
 *
 * @typedef {Object} ConfigData
 * @property {string} name - application name
 * @property {Array<string>} profiles - list of profiles included
 * @property {string} label - environment label
 * @property {string} version - commit hash of properties
 * @property {Array<module:Spring~ConfigFile>} propertySources - properties included for application,
 * sorted by more priority
 */
