'use strict';

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

    before(function (done) {
        server = helper.createServer(done);
        log = server.log;
        assertplus.object(server, 'unit test server');
    });

    after(function (done) {
        server.close();
        done();
    });

    it('test route creation for get', function (done) {
        var routeData =
        helper.getBaseUrlAndVersion('./test/fixture/es/container.json');
        assert.equal(routeData.length, 2, 'Need route base url and version');
        client = helper.createClient();
        enroute.createRoute({
            server: server,
            log: log,
            routeConf: [{filePath : './test/fixture/es/route.json',
                        baseUrl : routeData[0],
                        version: routeData[1]}],
            scriptPath : appRoot + '/test/fixture/es',
            preMiddleware: helper.preMiddleware(),
            postMiddleware: helper.postMiddleware()
        }, function () {
            var options = {
                path : '/website/test/gettest',
                headers: {
                    'accept-version': '1.0.5'
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
    it('test route creation for post', function (done) {
        var options = {
            path : '/website/test/posttest',
            headers: {
                'accept-version': '^1.0.1'
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

