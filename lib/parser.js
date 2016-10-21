'use strict';

var fs = require('fs');

var _ = require('lodash');
var assert = require('assert-plus');
var vasync = require('vasync');
var verror = require('verror');
var Ajv = require('ajv');

var SCHEMAS = require('./schemas');

module.exports = {
    parse: parse,
    // supported versions
    VERSIONS: [1],
    SCHEMAS: SCHEMAS
};

/**
 * Parse and validate a enroute config. This will verify that the config
 * is valid and return a POJO with the properties.
 *
 * @param {object} opts The options object
 * @param {string} [opts.data] The POJO of the config you want to validate.
 * @param {string} [opts.path] The path to the data on disk to validate.
 * @param {function} cb The callback f(err, result)
 *
 * @returns {function} The callback
 */
function parse(opts, cb) {
    assert.object(opts, 'opts');
    assert.optionalString(opts.path, 'opts.path');
    assert.optionalObject(opts.data, 'opts.data');
    assert.func(cb, 'cb');


    if (!opts.path && !opts.data) {
        throw new verror.VError('must specify at either opts.path or ' +
                                'opts.data');
    }

    var result;

    vasync.pipeline({arg: {}, funcs: [
        function readInput(it, _cb) {
            if (opts.data) {
                it.data = opts.data;
                _cb();
            } else {
                fs.readFile(opts.path, 'utf8', function (err, data) {
                    if (err) {
                        _cb(new verror.VError(
                            err, 'problem reading input from disk'));
                    } else {
                        try {
                            it.data = JSON.parse(data);
                            _cb();
                        } catch (e) {
                            _cb(e);
                        }
                    }
                });
            }
        },
        function validateSchemaVersion(it, _cb) {
            // this is a little funky, the reason we have to validate the
            // schema version manually is because we need to know which schema
            // to compile and use against the config. Therefore we have to
            // manually parse it out of the input and verify so we can choose
            // the schema version.
            try {
                assert.number(it.data.schemaVersion,
                              'input does not contain schema version');
            } catch (e) {
                return _cb(e);
            }

            it.schema = SCHEMAS[it.data.schemaVersion];

            if (!it.schema) {
                return _cb(new verror.VError('schema version ' +
                                            it.data.schemaVersion +
                                            ' not supported'));
            } else {
                // delete the schemaVersion since it's actually not defined in
                // the json schema.
                delete it.data.schemaVersion;
                return _cb();
            }
        },
        function validateInput(it, _cb) {
            _validateInput(it.schema, it.data, function (err, res) {
                result = res;
                return _cb(err);
            });
        }
    ]}, function (err, res) {
        return cb(err, result);
    });
}


/// Privates


function _validateInput(schema, data, cb) {
    var ajv = new Ajv({allErrors: true, verbose: true, format: 'full'});
    var validate = ajv.compile(schema);
    var valid = validate(data);

    if (!valid) {
        var errors = _.map(validate.errors, function (fakeErr) {
            return new verror.VError({
                name: 'EnrouteConfigCompileError',
                info: fakeErr
            });
        });
        var err = new verror.MultiError(errors, 'Invalid input');

        if (cb) {
            return cb(err);
        } else {
            throw err;
        }
    } else {
        if (cb) {
            return cb(null, _.cloneDeep(data));
        } else {
            return _.cloneDeep(data);
        }
    }
}
