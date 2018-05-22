'use strict';

var path = require('path');

var _ = require('lodash');
var assert = require('assert-plus');
var vasync = require('vasync');
var verror = require('verror');
var compose = require('restify').helpers.compose;
var bunyan = require('bunyan');
var LOG;

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

    if (typeof opts.log !== 'undefined') {
        LOG = opts.log.child({ component: 'enroute' });
    } else {
        LOG = bunyan.createLogger({name: 'enroute'});
    }

    vasync.pipeline({arg: {}, funcs: [
        // Read the routes from disk and parse them as functions
        function getRoutes(ctx, cb1) {
            ctx.routes = [];
            var barrier = vasync.barrier();
            barrier.on('drain', function () {
                return cb1();
            });

            if (opts.enroute.hotReload) {
                if (typeof opts.basePath !== 'undefined') {
                    LOG.info({basedir: opts.basePath},
                        'Hot reloading of routes is enabled for base dir');
                } else {
                    LOG.info('Hot reloading of routes is enabled.');
                }
            }

            // go through each of the route names
            _.forEach(opts.enroute.routes, function (methods, routeName) {
                // go through each of the HTTP methods
                _.forEach(methods, function (src, method) {
                    barrier.start(routeName + method);
                    // resolve to the correct file
                    var sourceFile = path.resolve(opts.basePath, src.source);
                    var route;

                    try {
                        route = {
                            name: routeName,
                            method: method,
                            func: opts.enroute.hotReload
                            ? function (req, resp, callback) {
                                reloadProxy(sourceFile, req,
                                    resp, callback, opts);
                            }
                            : require(sourceFile)
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
                var routePath = typeof route.name === 'string' &&
                     route.name[0] === '/'
                    ? route.name
                    : '/' + route.name;
                opts.server[route.method](routePath, route.func);
            });

            return cb1();
        }
    ]}, function (err, res) {
        return cb(err);
    });
}

function reloadProxy(sourceFile, req, resp, callback, opts) {
    if (typeof opts.basePath !== 'undefined') {
        //Delete code loaded from a specific base dir
        Object.keys(require.cache).forEach(function (cacheKey) {
            if (cacheKey.indexOf(opts.basePath) !== -1) {
                delete require.cache[cacheKey];
            }
        });
    } else {
        //Delete all cached entries
        Object.keys(require.cache).forEach(function (cacheKey) {
            delete require.cache[cacheKey];
        });
    }

    try {
        var handlers = require(sourceFile);
        var handlerChain = compose(handlers);

        handlerChain(req, resp, callback);
    } catch (e) {
        LOG.error('Uncaught error in route:');
        LOG.error(e);
        callback(e);
    }
}

module.exports = install;
