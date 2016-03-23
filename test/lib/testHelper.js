'use strict';


var path = require('path');
var bodyParser = require('body-parser');
var restify = require('restify');
var restifyClients = require('restify-clients');
var bunyan = require('bunyan');
var bootstrap = require('../../lib/index');
var assert = require('assert-plus');

var LOG = bunyan.createLogger({
    level: (process.env.LOG_LEVEL || bunyan.INFO),
    name: 'testlog',
    streams: [{
        level: bunyan.TRACE,
        type: 'raw',
        stream: new restify.bunyan.RequestCaptureStream({
            level: bunyan.WARN,
            maxRecords: 100,
            maxRequestIds: 100,
            stream: process.stderr
        })
    }],
    serializers: bunyan.stdSerializers
});
var appRoot = require('app-root-path').path;

/**
 * @private
 * create dtrace object for unit test
 * @returns {Object} dtrace object
 */
function getDtrace() {
    var dtp;

    try {
        var d = require('dtrace-provider');
        dtp = d.createDTraceProvider('nqBootstrapUnitTest');
    } catch (e) {
        dtp = null;
    }

    return (dtp);
}

/**
 * @private
 * json parse a file's content synchronously
 * read from disk
 * @throws {Error} If JSON.parse fails
 * @param  {String} fpath file path
 * @returns {Object}  file content as object
 */
function loadConf(fpath) {
    var confObj;

    try {
        confObj = JSON.parse(bootstrap.readFile(
            path.resolve(fpath),
            LOG, 'Can not find test config file '));
    } catch (err) {
        LOG.error(err);
        throw err;
    }
    assert.object(confObj, 'test config object');
    assert.number(confObj.restify.port, 'server port from config object');
    assert.string(confObj.restify.host,
        'server hostname or ip from config object');
    return confObj;
}


/**
 * create a restify server, listen on port specify from
 * config file
 * @param  {Function} cb optional callback function, done
 * when running in mocha
 * @returns {Object}   restify server
 */
module.exports.createServer = function createServer(cb) {
    var confObj = loadConf(appRoot + '/test/fixture/testConf.json');
    var port = process.env.UNIT_TEST_PORT || confObj.restify.port;
    var dtra = getDtrace();
    var server = restify.createServer({
        dtrace: dtra,
        log: LOG
    });

    server.on('after', restify.auditLogger({
        log: LOG.child({
            component: 'audit'
        })
    }));
    server.listen(port, confObj.restify.host, function (err) {
        if (err) {
            cb(err);
        }
        cb();
    });

    return server;
};

/**
 * @public
 * create restify json client object
 * @returns {Object} restify json client object
 */
module.exports.createClient = function createClient() {
    var confObj = loadConf(appRoot + '/test/fixture/testConf.json');
    var port = process.env.UNIT_TEST_PORT || confObj.restify.port;
    var dtra = getDtrace();
    var client = restifyClients.createJsonClient({
        url: 'http://' + confObj.restify.host + ':' + port,
        dtrace: dtra,
        retry: false
    });
    return client;
};

/**
 * @public
 * getBaseUrlAndVersion read account and group from conf file
 * generate baseUrl and version from it
 * @param  {String} confFile confile file's relative path to appRoot
 * @returns {Array} baseUrl string and version string or array
 */
module.exports.getBaseUrlAndVersion = function getBaseUrlAndVersion(confFile) {
    var fileAbsPath = path.normalize(path.join(appRoot, confFile));
    var confObj;
    var data = [];
    var version;

    try {
        confObj = JSON.parse(bootstrap.readFile(
            fileAbsPath,
            LOG, 'Can not find test config file '));
    } catch (err) {
        LOG.error(err);
        throw err;
    }
    var baseUrl = '';

    if (confObj.account && confObj.account.name) {
        baseUrl +=  '/' + confObj.account.name;
    }

    if (confObj.group) {
        baseUrl += '/' + confObj.group;
    }
    data.push(baseUrl);

    if (typeof confObj.version !== 'undefined') {
        data.push(confObj.version);
    }
    return data;
};

/**
 * @public
 * create testing common middleware called before route handler
 * including body parser
 * @returns {Array} array of middleware functions
 */
module.exports.preMiddleware = function mockPreMiddleware() {
    var mw = [];
    mw.push(bodyParser.json());
    mw.push(function context(req, res, next) {
        req.context = 'rest-enroute module';
        next();
    });
    return mw;
};

/**
 * @public
 * create testing common middleware called after route handler
 * including body parser
 * @returns {Array} array of middleware functions
 */
module.exports.postMiddleware = function mockPostMiddleware() {
    var mw = [];
    mw.push(function logData(req, res, next) {
        LOG.info('request end');
        next();
    });
    return mw;
};
