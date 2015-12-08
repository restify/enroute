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
        client = helper.createClient();
        enroute.createRoute({
            server: server,
            log: log,
            routeConf: [{filePath : './test/fixture/es/route.json',
                        baseUrl :
                        helper.getBaseUrl('./test/fixture/es/container.json')}],
            scriptPath : appRoot + '/test/fixture/es'
        }, function () {
            client.get('/0.0.1/website/test/gettest',
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
        client.post('/0.0.1/website/test/posttest', {body: 'test post'},
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

