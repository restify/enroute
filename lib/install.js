'use strict';

var path = require('path');

var assert = require('assert-plus');
var vasync = require('vasync');
var verror = require('verror');
var compose = require('restify').helpers.compose;
var bunyan = require('bunyan');

// local globals
var LOG;


/**
 * Install the enroute routes into the restify server.
 *
 * @param {object} opts Options object.
 * @param {object} opts.enroute The parsed enroute configuration.
 * @param {object} opts.log an optional logger
 * @param {boolean} [opts.hotReload] Whether to hot reload the routes
 * @param {object} opts.server The restify server.
 * @param {string} opts.basePath The basepath to resolve source files.
 * @param {string} [opts.excludePath] The path to exclude relative to the base
 * path for hot reloaded files
 * @param {function} cb The callback.
 * @returns {undefined}
 */
function install(opts, cb) {
    assert.object(opts, 'opts');
    assert.optionalObject(opts.log, 'opts.log');
    assert.object(opts.enroute, 'opts.enroute');
    assert.object(opts.server, 'opts.server');
    assert.string(opts.basePath, 'opts.basePath');
    assert.optionalString(opts.excludePath, 'opts.excludePath');
    assert.optionalBool(opts.hotReload, 'opts.hotReload');

    var log;

    if (opts.log) {
        log = opts.log.child({ component : 'enroute' });
    } else {
        // only create default logger if one wasn't passed in.
        if (!LOG) {
            LOG = bunyan.createLogger({ name: 'enroute' });
        }
        log = LOG;
    }

    vasync.pipeline({arg: {}, funcs: [
        // Read the routes from disk and parse them as functions
        function getRoutes(ctx, cb1) {
            ctx.routes = [];
            var barrier = vasync.barrier();
            barrier.on('drain', function () {
                return cb1();
            });

            if (opts.hotReload) {
                log.info({ basePath: opts.basePath },
                        'hot reloading of routes is enabled for base dir');
            }

            // go through each of the route names
            for (const [routeName, methods]
                of Object.entries(opts.enroute.routes)
            ) {
                // go through each of the HTTP methods
                for (const [method, src] of Object.entries(methods)) {
                    barrier.start(routeName + method);
                    // resolve to the correct file
                    const sourceFile = path.resolve(opts.basePath, src.source);
                    let route;

                    try {
                        var mod = (opts.hotReload) ?
                            // restify middleware wrapper for hot reload
                            function enrouteHotReloadProxy(req, res, next) {
                                return reloadProxy({
                                    basePath: opts.basePath,
                                    method: method,
                                    req: req,
                                    res: res,
                                    routeName: routeName,
                                    sourceFile: sourceFile,
                                    excludePath: opts.excludePath
                                }, next);
                            } : require(sourceFile);
                        var func = (
                                mod && mod.__esModule && 'default' in mod
                                && typeof mod !== 'function'
                            )
                            ? mod.default
                            : mod;

                        route = {
                            name: routeName,
                            method: method,
                            func: func
                        };
                    } catch (e) {
                        return cb1(new verror.VError({
                            name: 'EnrouteRequireError',
                            cause: e,
                            info: {
                                file: sourceFile,
                                route: routeName,
                                method: method
                            }
                        }, 'failed to require file, possible syntax error'));
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
                }
            }
            return null; // cb1() is called in 'drain' event above
        },
        function installRoutes(ctx, cb1) {
            for (const route of ctx.routes) {
                var routePath = typeof route.name === 'string' &&
                     route.name[0] === '/'
                    ? route.name
                    : '/' + route.name;
                opts.server[route.method](routePath, route.func);
            }

            return cb1();
        }
    ]}, function (err, res) {
        return cb(err);
    });
}


/**
 * using the restify handler composer, create a middleware on the fly that
 * re-requires the file on every load executes it.
 * @private
 * @function reloadProxy
 * @param {Object} opts an options object
 * @param {String} opts.basePath The basepath to resolve source files.
 * @param {String} opts.method http verb
 * @param {Object} opts.log the enroute logger
 * @param {Object} opts.req the request object
 * @param {Object} opts.res the response object
 * @param {String} opts.routeName the name of the restify route
 * @param {String} opts.sourceFile the response object
 * @param {Function} cb callback fn
 * @returns {undefined}
 */
function reloadProxy(opts, cb) {
    // TODO: deprecate this, since node doesn't provide a mechanism to clear
    // the ESM import cache, see https://github.com/nodejs/node/issues/49442
    assert.object(opts, 'opts');
    assert.string(opts.basePath, 'opts.basePath');
    assert.optionalString(opts.excludePath, 'opts.excludePath');
    assert.string(opts.method, 'opts.method');
    assert.object(opts.req, 'opts.req');
    assert.object(opts.res, 'opts.res');
    assert.string(opts.routeName, 'opts.routeName');
    assert.string(opts.sourceFile, 'opts.sourceFile');
    assert.func(cb, 'cb');

    var excludeFullpath = opts.basePath + '/' + opts.excludePath;

    // clear require cache for code loaded from a specific base dir
    Object.keys(require.cache).forEach(function (cacheKey) {
        if (opts.excludePath && cacheKey.indexOf(excludeFullpath) !== -1) {
            return;
        } else if (cacheKey.indexOf(opts.basePath) !== -1) {
            delete require.cache[cacheKey];
        }
    });

    var handlers;

    try {
        handlers = require(opts.sourceFile);
    } catch (e) {
        var err = new verror.VError({
            name: 'EnrouteRequireError',
            cause: e,
            info: {
                file: opts.sourceFile,
                route: opts.routeName,
                method: opts.method
            }
        }, 'failed to require file, possible syntax error');

        // now that the chain has failed, send back the require error.
        return cb(err);
    }

    // if no require error, execute the handler chain. any errors that occur at
    // runtime should be a runtime exception.
    var handlerChain = compose(handlers);
    return handlerChain(opts.req, opts.res, cb);
}


module.exports = install;
