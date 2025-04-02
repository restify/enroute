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

var [major, minor] = process.versions.node.split(/[v.]/).map(Number);

// https://github.com/nodejs/node/releases/tag/v20.19.0
// https://github.com/nodejs/node/releases/tag/v22.12.0
var nodeSupportsRequireESM = major > 22 || major === 22 && minor >= 12 ||
    major === 20 && minor >= 19;

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

if (nodeSupportsRequireESM) {
    CONFIG.routes.esm = {
        get: {
            source: './test/etc/esmGet.mjs'
        }
    };
}

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
            assertServer(CONFIG, done);
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
            assert.equal(exception.message, 'must specify opts.basePath');
            assert.isOk(exception.stack);
            done();
        }
    });

    it('should fail if route source DNE', function (done) {
        enroute.install({
            config: {
                schemaVersion: 1,
                routes: {
                    foo: {
                        get: {
                            source: 'source does not exist'
                        }
                    }
                }
            },
            server: SERVER,
            basePath: BASEPATH
        }, function (err) {
            assert.isOk(err);
            assert.isOk(err.stack);
            assert.include(err.message, 'Cannot find module');
            return done();
        });
    });

    it('should fail if route source has a syntax error', function (done) {
        enroute.install({
            config: {
                schemaVersion: 1,
                routes: {
                    foo: {
                        get: {
                            source: './test/etc/syntaxError.js'
                        }
                    }
                }
            },
            server: SERVER,
            basePath: BASEPATH
        }, function (err) {
            assert.isOk(err);
            assert.isOk(err.stack);
            assert.include(err.message, 'Unexpected identifier');
            return done();
        });
    });

    it('fails with sane message if two routes have a syntax error', done => {
        enroute.install({
            config: {
                schemaVersion: 1,
                routes: {
                    apples: {
                        get: {
                            source: './test/etc/syntaxError.js'
                        }
                    },
                    bananas: {
                        get: {
                            source: './test/etc/syntaxError.js'
                        }
                    }
                }
            },
            server: SERVER,
            basePath: BASEPATH
        }, function (err) {
            assert.isOk(err);
            assert.isOk(err.stack);
            assert.include(err.message, 'Unexpected identifier');
            done();
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
        mkdirp(HOT_RELOAD_TMP_DIR).then(function () {
            // copy over the hot reloaded route
            fsExtra.copy(BASEPATH + '/test/etc',
                HOT_RELOAD_TMP_DIR, function (e2) {
                    return done(e2);
                });
        }).catch(done);
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
            assertServer(HOT_RELOAD_CONFIG, function (err2) {
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
        mkdirp(HOT_RELOAD_TMP_DIR).then(function () {
            // copy over the hot reloaded route
            fsExtra.copy(BASEPATH + '/test/etc',
                HOT_RELOAD_TMP_DIR, function (e2) {
                    return done(e2);
                });
        }).catch(done);
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
            assertServer(HOT_RELOAD_CONFIG, function (err2) {
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

/// Privates


function assertServer(serverConfig, cb) {
    var config = _.cloneDeep(serverConfig);
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
                }

                if (method === 'options') {
                    /* eslint-disable no-param-reassign */
                    method = 'opts';
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
