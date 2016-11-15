'use strict';

var fs   = require('fs');
var path = require('path');

var _      = require('lodash');
var assert = require('assert-plus');
var vasync = require('vasync');
var verror = require('verror');

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
    assert.string(opts.enroute.basePath, 'opts.enroute.basePath');
    assert.object(opts.server, 'opts.server');

    vasync.pipeline({arg: {}, funcs: [
        // Read the routes from disk and parse them as functions
        function getRoutes(ctx, cb1) {
            ctx.routes = [];
            var barrier = vasync.barrier();
            barrier.on('drain', function () {
                return cb1();
            });

            // basePath is used to correctly resolve the path to the source
            // files
            var basePath = opts.enroute.basePath;

            // go through each of the route names
            _.forEach(opts.enroute.routes, function (methods, routeName) {
                // go through each of the HTTP methods
                _.forEach(methods, function (src, method) {
                    barrier.start(routeName + method);
                    // resolve to the correct file
                    var sourceFile = path.resolve(basePath, src.source);
                    // use the resolved file path
                    fs.readFile(sourceFile,
                        {encoding: 'utf8'},
                        function (err, data) {
                        if (err) {
                            return cb1(new verror.VError({
                                err: err,
                                info: {
                                    route: routeName,
                                    method: method,
                                    fileName: src.source
                                }
                            }, 'unable to read route source from disk'));
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
                            return cb1(new verror.VError({
                                err: e,
                                info: {
                                    func: data,
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
