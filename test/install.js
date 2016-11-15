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

var CONFIG = {
    schemaVersion: 1,
    basePath: path.join(__dirname, '..', '/test'),
    routes: {
        foo: {
            get: {
                source: './etc/fooGet.js'
            },
            post: {
                source: './etc/fooPost.js'
            },
            put: {
                source: './etc/fooPut.js'
            },
            delete: {
                source: './etc/fooDelete.js'
            },
            head: {
                source: './etc/fooHead.js'
            },
            patch: {
                source: './etc/fooPatch.js'
            },
            options: {
                source: './etc/fooOptions.js'
            }
        },
        bar: {
            get: {
                source: './etc/barGet.js'
            },
            post: {
                source: './etc/barPost.js'
            },
            put: {
                source: './etc/barPut.js'
            },
            delete: {
                source: './etc/barDelete.js'
            },
            head: {
                source: './etc/barHead.js'
            },
            patch: {
                source: './etc/barPatch.js'
            },
            options: {
                source: './etc/barOptions.js'
            }
        },
        array: {
            get: {
                source: './etc/arrayGet.js'
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
            server: SERVER
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
            server: SERVER
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should fail if route source is not a function', function (done) {
        enroute.install({
            config: {
                foo: {
                    get: './etc/notAFunction.js'
                }
            },
            server: SERVER
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
