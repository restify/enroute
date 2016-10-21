'use strict';

var fs = require('fs');

var _ = require('lodash');
var assert = require('assert-plus');
var vasync = require('vasync');

/**
 * Install the enroute routes into the restify server.
 *
 * @param {object} opts Options object.
 * @param {object} opts.enroute The parsed enroute configuration.
 * @param {object} opts.server The restify server.
 * @param {function} cb The callback.
 * @returns {undefined}
 */
function install(opts, cb) {
    assert.object(opts, 'opts');
    assert.object(opts.enroute, 'opts.enroute');
    assert.object(opts.server, 'opts.server');

    vasync.pipeline({arg: {}, funcs: [
        // Read the routes from disk and parse them as functions
        function getRoutes(ctx, _cb) {
            ctx.routes = [];
            var barrier = vasync.barrier();
            barrier.on('drain', function () {
                return _cb();
            });

            // go through each of the route names
            _.forEach(opts.enroute, function (methods, routeName) {
                // go through each of the HTTP methods
                _.forEach(methods, function (src, method) {
                    barrier.start(routeName + method);
                    fs.readFile(src.source,
                        {encoding: 'utf8'},
                        function (err, data) {
                        if (err) {
                            return _cb(err);
                        }
                        var route;
                        try {
                            route = {
                                name: routeName,
                                method: method,
                                /* eslint-disable no-eval */
                                func: eval(data)
                                /* eslint-enable no-eval */
                            };
                        } catch (e) {
                            return _cb(e);
                        }
                        // if HTTP method is 'delete', since restify uses 'del'
                        // instead of 'delete', change it to 'del'
                        if (route.method === 'delete') {
                            route.method = 'del';
                        }
                        // if HTTP method is 'options', since restify uses
                        // 'opts' instead of 'options', change it to 'opts'
                        if (route.method === 'options') {
                            route.method = 'opts';
                        }
                        ctx.routes.push(route);
                        barrier.done(routeName + method);
                        return null;
                    });
                });
            });
        },
        function installRoutes(ctx, _cb) {
            _.forEach(ctx.routes, function (route) {
                opts.server[route.method](route.name, route.func);
            });

            return _cb();
        }
    ]}, function (err, res) {
        if (err) {
            return cb(err);
        }

        return cb();
    });
}

module.exports = install;
