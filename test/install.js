'use strict';

var path = require('path');

var _ = require('lodash');
var assert = require('chai').assert;
var fsExtra = require('fs-extra');
var mkdirp = require('mkdirp');
var restify = require('restify');
var restifyClients = require('restify-clients');
var vasync = require('vasync');
var uuid = require('uuid');

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

var HOT_RELOAD_CONFIG = {
    schemaVersion: 1,
    routes: {
        foo: {
            get: {
                source: './fooGet.js'
            },
            post: {
                source: './fooPost.js'
            },
            put: {
                source: './fooPut.js'
            },
            delete: {
                source: './fooDelete.js'
            },
            head: {
                source: './fooHead.js'
            },
            patch: {
                source: './fooPatch.js'
            },
            options: {
                source: './fooOptions.js'
            }
        },
        bar: {
            get: {
                source: './barGet.js'
            },
            post: {
                source: './barPost.js'
            },
            put: {
                source: './barPut.js'
            },
            delete: {
                source: './barDelete.js'
            },
            head: {
                source: './barHead.js'
            },
            patch: {
                source: './barPatch.js'
            },
            options: {
                source: './barOptions.js'
            }
        },
        array: {
            get: {
                source: './arrayGet.js'
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

    it('should throw exception if basePath is not provided', function (done) {
        try {
            enroute.install({
                config: CONFIG,
                server: SERVER
            }, function (err) {
                assert.ifError(err);
            });
        } catch (exception) {
            assert.isNotNull(exception, 'Exception should exist');
            assert.equal(exception.actual, 'must specify opts.basePath');
            assert.isOk(exception.stack);
            done();
        }
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
            assert.isOk(err.stack);
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
            assert.isOk(err.stack);
            return done();
        });

    });

    after(function (done) {
        SERVER.close(function () {
            return done();
        });
    });
});

describe('hot reload', function () {
    var HOT_RELOAD_TMP_DIR = '/tmp/' + uuid.v4();

    beforeEach(function (done) {
        SERVER = restify.createServer();
        /* eslint-disable consistent-return */
        mkdirp(HOT_RELOAD_TMP_DIR, function (err) {
            if (err) {
                return done(err);
            }
            // copy over the hot reloaded route
            fsExtra.copy(BASEPATH + '/test/etc',
                HOT_RELOAD_TMP_DIR, function (e2) {
                    return done(e2);
                });
        });
    });

    it('should hot reload routes', function (done) {
        enroute.install({
            config: HOT_RELOAD_CONFIG,
            server: SERVER,
            basePath: HOT_RELOAD_TMP_DIR,
            hotReload: true
        }, function (err) {
            assert.ifError(err);
            // assert the routes were installed correctly
            assertServer({}, function (err2) {
                assert.ifError(err2);
                // now we change fooGet.js to return a 'reload' header
                fsExtra.copy(HOT_RELOAD_TMP_DIR + '/fooHotReload.js',
                    HOT_RELOAD_TMP_DIR + '/fooGet.js', function (err3) {

                        assert.ifError(err3);
                        var client = restifyClients.createStringClient('http://'
                            + HOST + ':' + PORT);
                        client.get('/foo', function (err4, req, res, obj) {
                            client.close();
                            assert.ifError(err4);
                            assert.equal('yes', res.headers.reload);
                            return done();
                        });
                    });
            });
        });
    });

    afterEach(function (done) {
        fsExtra.remove(HOT_RELOAD_TMP_DIR, function () {
            SERVER.close(function () {
                return done();
            });
        });
    });
});

// separate suite to prevent Mocha from running multiple tests at once
describe('hot reload exclude', function () {
    var HOT_RELOAD_TMP_DIR = '/tmp/' + uuid.v4();
    before(function (done) {
        SERVER = restify.createServer();
        /* eslint-disable consistent-return */
        mkdirp(HOT_RELOAD_TMP_DIR, function (err) {
            if (err) {
                return done(err);
            }
            // copy over the hot reloaded route
            fsExtra.copy(BASEPATH + '/test/etc',
                HOT_RELOAD_TMP_DIR, function (e2) {
                    return done(e2);
                });
        });
    });

    it('should not hot reload routes that are excluded', function (done) {
        enroute.install({
            config: HOT_RELOAD_CONFIG,
            server: SERVER,
            basePath: HOT_RELOAD_TMP_DIR,
            excludePath: 'fooGet.js',
            hotReload: true
        }, function (err) {
            assert.ifError(err);
            // assert the routes were installed correctly
            assertServer({}, function (err2) {
                assert.ifError(err2);
                // now we change fooGet.js to return a 'reload' header
                fsExtra.copy(HOT_RELOAD_TMP_DIR + '/fooHotReload.js',
                    HOT_RELOAD_TMP_DIR + '/fooGet.js', function (err3) {

                        assert.ifError(err3);
                        var client = restifyClients.createStringClient('http://'
                            + HOST + ':' + PORT);
                        client.get('/foo', function (err4, req, res, obj) {
                            client.close();
                            assert.ifError(err4);
                            assert.isNotOk(res.headers.reload);
                            return done();
                        });
                    });
            });
        });
    });

    afterEach(function (done) {
        fsExtra.remove(HOT_RELOAD_TMP_DIR, function () {
            SERVER.close(function () {
                return done();
            });
        });
    });
});

describe('case sensitive routes', function () {
    beforeEach(function () {
        SERVER = restify.createServer();
    });

    it('should install routes with caseSensitive === false', function (done) {
        enroute.install({
            config: _.merge({}, CONFIG, {
                schemaVersion: 2,
                caseSensitive: false
            }),
            server: SERVER,
            basePath: BASEPATH
        }, function (err) {
            assert.ifError(err);
            assertServer({}, done);
        });
    });

    it('should install routes with caseSensitive === true', function (done) {
        enroute.install({
            config: _.merge({}, CONFIG, {
                schemaVersion: 2,
                caseSensitive: true
            }),
            server: SERVER,
            basePath: BASEPATH
        }, function (err) {
            assert.ifError(err);
            assertServer({}, done);
        });
    });

    it('should throw exception if caseSensitive set and is not boolean',
        function (done) {
            try {
                enroute.install({
                    config: _.merge({}, CONFIG, {
                        schemaVersion: 2,
                        caseSensitive: 'true'
                    }),
                    server: SERVER
                }, function (err) {
                    assert.ifError(err);
                });
            } catch (exception) {
                assert.isNotNull(exception, 'Exception should exist');
                assert.equal(exception.actual,
                    'must specify opts.basePath');
                assert.isOk(exception.stack);
                done();
            }
        });

    afterEach(function (done) {
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
