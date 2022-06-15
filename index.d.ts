/// <reference types="node" />

declare module 'cloud-config-client' {

    import http = require('http');
    import https = require('https');

    export function load(options: Options, callback?: LoadCallback): Promise<Config>;

    export abstract class Config {
        constructor(data: ConfigData, context: { [key: string]: any });

        properties: { [key: string]: any }

        raw: { [key: string]: any }

        get(keyParts: string): any

        forEach(callback: (property: string, value: string) => void, includeOverridden?: boolean): void

        toObject(): { [key: string]: any }

        toString(spaces: number): string
    }

    interface ConfigFile {
        /** file name */
        name: string

        /** configuration properties */
        source: ConfigSource
    }

    type ConfigSource = {
        [key: string]: any
    }

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
        context?: { [key: string]: any }

        /** Additional headers */
        headers?: { [key: string]: any }
    }

    interface LoadCallback {
        (error: Error, config?: Config): void
    }
}
