'use strict';

var fs      = require('fs');
var path    = require('path');

var _      = require('lodash');
var assert = require('assert-plus');
var vasync = require('vasync');
var verror = require('verror');
var Ajv    = require('ajv');

var SCHEMAS  = require('./schemas');
var VERSIONS = [1];

module.exports = {
    parse: parse,
    // supported versions
    VERSIONS: VERSIONS,
    SCHEMAS: SCHEMAS
};


/// API


/**
 * Parse and validate a enroute config. This will verify that the config
 * is valid and return a POJO with the properties. Note only one of opts.config
 * or opts.configPath is needed.
 *
 * @param {object} opts The options object
 * @param {string} [opts.config] The POJO of the config you want to validate.
 * @param {string} [opts.configPath] The path to the config on disk to validate.
 * @param {function} cb The callback f(err, validatedConfig)
 *
 * @returns {function} The callback
 */
function parse(opts, cb) {
    assert.object(opts, 'opts');
    assert.optionalString(opts.configPath, 'opts.configPath');
    assert.optionalObject(opts.config, 'opts.config');
    assert.func(cb, 'cb');


    if (!opts.configPath && !opts.config) {
        throw new verror.VError('must specify either opts.configPath or ' +
                                'opts.config');
    }

    var validatedConfig;

    vasync.pipeline({arg: {}, funcs: [
        function readInput(it, cb1) {
            if (opts.config) {
                it.config = opts.config;
                cb1();
            } else {
                // find basePath from `configPath` opts
                var basePath = path.dirname(opts.configPath);
                fs.readFile(opts.configPath, 'utf8', function (err, config) {
                    if (err) {
                        cb1(new verror.VError({
                            err: err,
                            info: {
                                fileName: opts.configPath
                            }
                        }, 'problem reading input from disk'));
                    } else {
                        try {
                            it.config = JSON.parse(config);
                            // set the basePath, we are overriding any basePath
                            // if it was provided
                            it.config.basePath = basePath;
                            cb1();
                        } catch (e) {
                            cb1(new verror.VError({
                                err: err,
                                info: {
                                    fileName: opts.configPath,
                                    fileContents: config
                                }
                            },'problem parsing JSON'));
                        }
                    }
                });
            }
        },
        function validateSchemaVersion(it, cb1) {
            // this is a little funky, the reason we have to validate the
            // schema version manually is because we need to know which schema
            // to compile and use against the config. Therefore we have to
            // manually parse it out of the input and verify so we can choose
            // the schema version.
            try {
                assert.number(it.config.schemaVersion,
                              'input does not contain schema version');
            } catch (e) {
                return cb1(e);
            }

            it.schema = SCHEMAS[it.config.schemaVersion];

            if (!it.schema) {
                return cb1(new verror.VError({
                    info: {
                        parsedVersion: it.config.schemaVersion,
                        supportedVersions: VERSIONS
                    }
                }, 'schema version not supported'));
            } else {
                return cb1();
            }
        },
        function validateInput(it, cb1) {
            _validateInput(it.schema, it.config, function (err, res) {
                validatedConfig = res;
                return cb1(err);
            });
        }
    ]}, function (err, res) {
        return cb(err, validatedConfig);
    });
}


/// Privates


/**
 * _validateInput Validates the config against the schema.
 *
 * @param {object} schema The enroute schema to validate against.
 * @param {object} config The config to validate.
 * @param {function} cb The callback of the form f(err, config)
 * @returns {undefined}
 */
function _validateInput(schema, config, cb) {
    var ajv = new Ajv({allErrors: true, verbose: true, format: 'full'});
    var validate = ajv.compile(schema);
    var valid = validate(config);

    if (!valid) {
        // ajv does not return a real error object, hence the dance here to
        // produce real errors.
        var errors = _.map(validate.errors, function (fakeErr) {
            return new verror.VError({
                name: 'EnrouteConfigValidationError',
                info: fakeErr
            }, 'config validation error');
        });
        var err = new verror.MultiError(errors, 'Invalid input');
        return cb(err);
    } else {
        return cb(null, _.cloneDeep(config));
    }
}
