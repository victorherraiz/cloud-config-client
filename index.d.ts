/// <reference types="node" />

declare module 'cloud-config-client' {

    import http = require('http');
    import https = require('https');

    export function load(options: Options, callback?: LoadCallback): Promise<Config|Error>;

    export abstract class Config {
        constructor(data: ConfigData, context: Object);

        properties(): Object

        raw(): Object

        get(keyParts: string): any

        forEach(callback: Function, includeOverridden: boolean): void

        toObject(): Object

        toString(spaces: number): string
    }

    interface ConfigFile {
        /** file name */
        name: string

        /** configuration properties */
        source: ConfigSource
    }

    interface ConfigSource {}

    interface ConfigData {
        /** application name */
        name: string

        /** ist of profiles included */
        profiles: Array<string>

        /** environment label */
        label: string

        /** commit hash of properties */
        version: string

        /** properties included for application, sorted by more priority */
        propertySources: Array<ConfigFile>

    }

    interface Spring {
        ConfigFile: ConfigFile
        ConfigData: ConfigData
        ConfigSource: Map<string, any>
    }

    interface Auth {
        /** user id */
        user: string

        /** user password */
        pass: string
    }

    interface Options {
        /** spring config service url */
        endpoint?: string

        /** if false accepts self-signed certificates */
        rejectUnauthorized?: boolean

        /** @deprecated use name */
        application?: string

        /** application id */
        name: string

        /** application profile(s) */
        profiles?: string|string[]

        /** environment id */
        label?: string

        /** auth configuration */
        auth?: Auth

        /** Agent for the request */
        agent?: http.Agent|https.Agent

        /** Context for substitution */
        context?: Object
    }

    interface LoadCallback {
        /** whether there was an error retrieving configurations */
        error?: Error

        /** configuration object instance */
        config?: Config
    }
}
