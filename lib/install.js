'use strict';

var path = require('path');

var _ = require('lodash');
var assert = require('assert-plus');
var vasync = require('vasync');
var verror = require('verror');

/**
 * Install the enroute routes into the restify server.
 *
 * @param {object} opts Options object.
 * @param {object} opts.enroute The parsed enroute configuration.
 * @param {object} opts.server The restify server.
 * @param {string} opts.basePath The basepath to resolve source files.
 * @param {function} cb The callback.
 * @returns {undefined}
 */
function install(opts, cb) {
    assert.object(opts, 'opts');
    assert.object(opts.enroute, 'opts.enroute');
    assert.object(opts.server, 'opts.server');
    assert.string(opts.basePath, 'opts.basePath');

    vasync.pipeline({arg: {}, funcs: [
        // Read the routes from disk and parse them as functions
        function getRoutes(ctx, cb1) {
            ctx.routes = [];
            var barrier = vasync.barrier();
            barrier.on('drain', function () {
                return cb1();
            });

            // go through each of the route names
            _.forEach(opts.enroute.routes, function (methods, routeName) {
                // go through each of the HTTP methods
                _.forEach(methods, function (src, method) {
                    barrier.start(routeName + method);
                    // resolve to the correct file
                    var sourceFile = path.resolve(opts.basePath, src.source);
                    var route;

                    try {
                        var func = require(sourceFile)
                        route = {
                            name: routeName,
                            method: method,
                            func: typeof func === 'function' ? func : func[Object.keys(func)[0]]
                        };
                    } catch (e) {
                        return cb1(new verror.VError({
                            cause: e,
                            info: {
                                file: sourceFile,
                                route: routeName,
                                method: method
                            }
                        }, 'route function is invalid'));
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
        },
        function installRoutes(ctx, cb1) {
            _.forEach(ctx.routes, function (route) {
                opts.server[route.method](route.name, route.func);
            });

            return cb1();
        }
    ]}, function (err, res) {
        return cb(err);
    });
}

module.exports = install;
