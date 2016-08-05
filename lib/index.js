/*
 * restify-enroute
 * dynamically inject routes into restify app from configuration file
 *
 * Copyright (c) 2015 Netflix, Inc.
 * Licensed under the MIT license.
 */
'use strict';


var path = require('path');
var fs = require('fs');

var assert = require('assert-plus');
var Verror = require('verror');
var shell = require('shelljs');
var restify = require('restify');

/**
 * checks if the path is device rooted, that is, if it has [drive letter]:\ at its beggining.
 * @private
 * @param {String} fpath
 *      The file path to check
 * @returns {Boolean}
 *      Whether the path is rooted or not.
 */
function isWin32DeviceRoot(fpath) {
    // Only for win32
    if (process.platform !== 'win32') {
        return false;
    }

    // Any drive letter followed by :\
    var deviceRoot = /^[A-Za-z]:\\/;
    return deviceRoot.test(fpath);
}

/**
 * read file synchronously, throw Verror
 * on error, log the error message
 * @public
 * @param  {String} fpath  file path
 * @param  {Object} log    log object
 * @param  {String} errMsg Custom error message
 * @returns {String}        Content of the file
 */
function readFile(fpath, log, errMsg) {
    var content;
    var errObj;

    try {
        content = fs.readFileSync(fpath, 'utf8');
    } catch (err) {
        errObj = new Verror(err, errMsg + '%s', fpath);
        log.error(errObj);
        throw errObj;
    }
    return content;
}

function requireHandlerFunc(filePath, log) {
    var scriptPath = filePath;
    var handlerFunc;

    if (!scriptPath.endsWith('.js')) {
        scriptPath += '.js';
    }

    try {
        handlerFunc = require(scriptPath);
    } catch (err) {
        var errObj = new Verror(err, 'Fail to load %s',
            scriptPath);
        log.error(errObj);
        throw errObj;
    }
    return handlerFunc;
}

/**
 * insert restify expiry middleware after each
 * handler function to prevent expired request
 * to continue process
 * @public
 * @param  {Array} middlewareArr middleware handler array
 * @param  {Object} expiry  expiry plugin middleware config
 * @returns {Array}  middleware handler array that has expiry plugin
 */
function appendExpiryCheck(middlewareArr, expiry) {
    var finalHdlList = [];
    if (Array.isArray(middlewareArr)) {
        middlewareArr.forEach(function(fn) {
            finalHdlList.push(fn);
            finalHdlList.push(restify.requestExpiry(expiry));
        });
    } else {
        finalHdlList = middlewareArr;
        finalHdlList.push(restify.requestExpiry(expiry));
    }
    return finalHdlList;
}
/**
 * take the handlers from a route config file and setup routes into
 * restify server
 * @public
 * @function createRoute
 * @param   {Object} options required options.server, restify server
 * object, required options.log bunyan log object, optional,
 * options.preMiddleware
 * a list of middleware called before route handler, optional,
 * options.postMiddleware
 * a list of middleware called after route handler, optional, options.routeConf,
 * array of object contains route configuration file relative path to app root
 * and optional base url path
 * for example, one set of route configuration
 * [{filePath : ./etc/routes/route.json, baseUrl : 'v1/myaccount/'}
 * @param   {Function} cb    optional callback function
 * @returns {undefined}
 */

function createRoute(options, cb) {
    assert.object(options.server, 'options.server restify server');
    assert.object(options.log, 'options.log bunyan log');
    assert.arrayOfObject(options.routeConf,
        'options.routeConf route conifguration files');
    assert.optionalString(options.scriptPath,
        'options.scriptPath, optionally for test');
    assert.optionalObject(options.expiry,
        'options.expiry, optionally check expiry after each middleware');
    var server = options.server;
    var log = options.log;
    var appRoot = shell.pwd();
    var scriptRoot = options.scriptPath;
    var preMiddleware = options.preMiddleware;
    var postMiddleware = options.postMiddleware;
    var expiry = options.expiry;

    options.routeConf.forEach(function (routeConf) {
        var configFilePath =
        path.normalize(path.join(appRoot, routeConf.filePath));
        var baseUrl = routeConf.baseUrl || '';
        var routeConfContent = readFile(configFilePath, log,
        'Can not find route config file at ');
        var routeConfObj;
        var routes;
        var routelist = {};

        try {
            routeConfObj = JSON.parse(routeConfContent);
        } catch (err) {
            throw new Verror(err, 'invalid route config format');
        }

        routes = routeConfObj.routes;
        Object.keys(routes).forEach(function (rpath) {
            //deliminate route path and method with }
            var routePath = baseUrl + '/' + rpath;
            Object.keys(routes[rpath]).forEach(function (method) {
                var actions = [];
                //var routeKey;
                var scriptFpath = routes[rpath][method].source;
                var handlerFunc;

                if (scriptRoot) {
                    scriptFpath = path.normalize(path.join(scriptRoot,
                        scriptFpath));
                } else {
                    scriptFpath = path.resolve(scriptFpath);
                    // make sure the path casing obeys the casing of the parent
                    if (isWin32DeviceRoot(scriptFpath) && scriptFpath.substr(0, 2).toLowerCase() === module.filename.substr(0, 2).toLowerCase()) {
                        scriptFpath = module.filename.substr(0, 2) + scriptFpath.substr(2);
                    }
                }
                //routeKey = routePath + '}' + method;

                if (typeof routelist[routePath] !== 'undefined') {
                    throw new Error('Route path exist' + rpath 
                        + ' method ' + method);
                }


                handlerFunc = requireHandlerFunc(scriptFpath, log);
                //routelist[routeKey] = handlerFunc;

                if (preMiddleware) {
                    if (Array.isArray(preMiddleware)) {
                        actions = actions.concat(preMiddleware);
                    } else {
                        actions.push(preMiddleware);
                    }
                }

                if (handlerFunc) {
                    if (Array.isArray(handlerFunc)) {
                        actions = actions.concat(handlerFunc);
                    } else {
                        actions.push(handlerFunc);
                    }
                }

                if (postMiddleware) {
                    if (Array.isArray(postMiddleware)) {
                        actions = actions.concat(postMiddleware);
                    } else {
                        actions.push(postMiddleware);
                    }
                }

                if (expiry) {
                    actions = appendExpiryCheck(actions, expiry);
                }
                server[method.toLowerCase()](routePath, actions);

            });
        });
    });

    if (cb && typeof cb === 'function') {
        cb();
    }
}

module.exports = {
    createRoute : createRoute,
    readFile : readFile
};

