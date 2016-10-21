'use strict';

var assert = require('assert-plus');
var vasync = require('vasync');

var install = require('./install');
var parser = require('./parser');

/**
 * exports
 *
 * @param {object} opts Options object.
 * @param {string} [opts.config] The POJO of the config you want to validate.
 * @param {string} [opts.configPath] The path to the data on disk to validate.
 * @param {string} opts.server The restify server to install the routes onto.
 * @param {function} cb The callback f(err, result)
 * @returns {undefined}
 */
module.exports = function (opts, cb) {
    assert.object(opts, 'opts');
    assert.func(cb, 'cb');
    // asserts of other inputs done by parse and installRoutes repectively
    vasync.pipeline({arg: {}, funcs: [
        function parse(ctx, _cb) {
            parser.parse(opts, function (err, config) {
                ctx.config = config;
                return _cb(err);
            });
        },
        function installRoutes(ctx, _cb) {
            install({
                enroute: ctx.config,
                server: opts.server
            }, function (err) {
                return _cb(err);
            });
        }
    ]}, function (err, res) {
        return cb(err);
    });
};
