'use strict';

var path = require('path');

var _ = require('lodash');
var assert = require('chai').assert;
var restify = require('restify');
var restifyClients = require('restify-clients');
var vasync = require('vasync');

var enroute = require('../lib/index');

var HOST = 'localhost' || process.env.HOST;
var PORT = 1337 || process.env.PORT;
var BASEPATH = path.join(__dirname, '..');

var CONFIG = {
    schemaVersion: 1,
    routes: {
        foo: {
            get: {
                source: './test/etc/fooGet.js'
            },
            post: {
                source: './test/etc/fooPost.js'
            },
            put: {
                source: './test/etc/fooPut.js'
            },
            delete: {
                source: './test/etc/fooDelete.js'
            },
            head: {
                source: './test/etc/fooHead.js'
            },
            patch: {
                source: './test/etc/fooPatch.js'
            },
            options: {
                source: './test/etc/fooOptions.js'
            }
        },
        bar: {
            get: {
                source: './test/etc/barGet.js'
            },
            post: {
                source: './test/etc/barPost.js'
            },
            put: {
                source: './test/etc/barPut.js'
            },
            delete: {
                source: './test/etc/barDelete.js'
            },
            head: {
                source: './test/etc/barHead.js'
            },
            patch: {
                source: './test/etc/barPatch.js'
            },
            options: {
                source: './test/etc/barOptions.js'
            }
        },
        array: {
            get: {
                source: './test/etc/arrayGet.js'
            }
        }
    }
};

var SERVER;

describe('enroute-install', function () {
    before(function () {
        SERVER = restify.createServer();
    });

    it('should install routes', function (done) {
        enroute.install({
            config: CONFIG,
            server: SERVER,
            basePath: BASEPATH
        }, function (err) {
            assert.ifError(err);
            assertServer({}, done);
        });
    });

    it('should fail if route source DNE', function (done) {
        enroute.install({
            config: {
                foo: {
                    get: 'source does not exist'
                }
            },
            server: SERVER,
            basePath: BASEPATH
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should fail if route source is not a function', function (done) {
        enroute.install({
            config: {
                foo: {
                    get: './test/etc/notAFunction.js'
                }
            },
            server: SERVER,
            basePath: BASEPATH
        }, function (err) {
            assert.isOk(err);
            return done();
        });

    });

    after(function (done) {
        SERVER.close(function () {
            return done();
        });
    });
});


/// Privates


function assertServer(opts, cb) {
    var config = _.cloneDeep(CONFIG);
    delete config.schemaVersion;

    var client;

    var barrier = vasync.barrier('checkServer');
    barrier.on('drain', function () {
        client.close();
        return cb();
    });

    SERVER.listen(PORT, function () {
        client = restifyClients.createStringClient('http://' + HOST + ':' +
            PORT);
        _.forEach(config.routes, function (route, name) {
            _.forEach(route, function (source, method) {
                if (method === 'delete') {
                    /* eslint-disable no-param-reassign */
                    method = 'del';
                    /* eslint-enable no-function-reassign */
                }

                if (method === 'options') {
                    /* eslint-disable no-param-reassign */
                    method = 'opts';
                    /* eslint-enable no-function-reassign */
                }
                barrier.start(method + name);
                client[method]('/' + name, function (err, req, res, obj) {
                    assert.ifError(err);
                    assert.equal(name, res.headers.name);
                    assert.equal(method, res.headers.method);
                    barrier.done(method + name);
                });
            });
        });
    });
}
