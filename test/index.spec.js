'use strict';


var path = require('path');

var assert = require('chai').assert;
var assertplus = require('assert-plus');
var enroute = require('../lib/index');
var helper = require('./lib/testHelper');
var shell = require('shelljs');

describe('restify/enroute node module.', function () {
    var server;
    var client;
    var log;
    var appRoot = shell.pwd();

    beforeEach(function (done) {
        server = helper.createServer(done);
        client = helper.createClient();
        log = server.log;
        assertplus.object(server, 'unit test server');
    });

    afterEach(function (done) {
        server.close(function () {
            done();
        });
    });

    it('test route creation using configuration file for get', function (done) {
        enroute.createRoute({
            server: server,
            log: log,
            routeConf: [{filePath : './test/fixture/es/route.json',
                        baseUrl : helper.getBaseUrl('./test/fixture/es/container.json')}],
            scriptPath : appRoot + '/test/fixture/es',
            preMiddleware: helper.preMiddleware(),
            postMiddleware: helper.postMiddleware(),
            expiry: {header: 'x-request-expiry-time'}
        }, function () {
            var options = {
                path : '/website/test/gettest',
                headers: {
                    connection: 'close'
                }
            };
            client.get(options,
                function (err, req, res, obj) {
                if (err) {
                    done(err);
                }
                assert.equal(obj.data, 'Hello world!',
                          'Hello World endpoint response.');
                done();
            });
        });
    });
    it('test route creation using configuration file for post', function (done) {
        enroute.createRoute({
            server: server,
            log: log,
            routeConf: [{routeDefinitionObj : require(path.resolve('./test/fixture/es/route.json')),
                        baseUrl : helper.getBaseUrl('./test/fixture/es/container.json')}],
            scriptPath : appRoot + '/test/fixture/es',
            preMiddleware: helper.preMiddleware(),
            postMiddleware: helper.postMiddleware(),
            expiry: {header: 'x-request-expiry-time'}
        }, function () {
        var options = {
            path : '/website/test/posttest',
            headers: {
                    connection: 'close'
                }
        };
        client.post(options, {body: 'test post'},
            function (err, req, res, obj) {
                if (err) {
                    done(err);
                }
                assert.equal(obj.data, 'post succeed',
                         'test post');
                done();
            });
    });
    });
    it('test route creation using route config definition object for get', function (done) {
        enroute.createRoute({
            server: server,
            log: log,
            routeConf: [{routeDefinitionObj : require(path.resolve('./test/fixture/es/route.json')),
                        baseUrl : helper.getBaseUrl('./test/fixture/es/container.json')}],
            scriptPath : appRoot + '/test/fixture/es',
            preMiddleware: helper.preMiddleware(),
            postMiddleware: helper.postMiddleware(),
            expiry: {header: 'x-request-expiry-time'}
        }, function () {
            var options = {
                path : '/website/test/gettest',
                headers: {
                    connection: 'close'
                }
            };
            client.get(options,
                function (err, req, res, obj) {
                if (err) {
                    done(err);
                }
                assert.equal(obj.data, 'Hello world!',
                          'Hello World endpoint response.');
                done();
            });
        });
    });
    it('test route creation using configuration file for post', function (done) {
        enroute.createRoute({
            server: server,
            log: log,
            routeConf: [{routeDefinitionObj : require(path.resolve('./test/fixture/es/route.json')),
                        baseUrl : helper.getBaseUrl('./test/fixture/es/container.json')}],
            scriptPath : appRoot + '/test/fixture/es',
            preMiddleware: helper.preMiddleware(),
            postMiddleware: helper.postMiddleware(),
            expiry: {header: 'x-request-expiry-time'}
        }, function () {
        var options = {
            path : '/website/test/posttest',
            headers: {
                    connection: 'close'
                }
        };
        client.post(options, {body: 'test post'},
            function (err, req, res, obj) {
                if (err) {
                    done(err);
                }
                assert.equal(obj.data, 'post succeed',
                         'test post');
                done();
            });
    });
    });

});

