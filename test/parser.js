'use strict';

var _ = require('lodash');
var assert = require('chai').assert;
var uuid = require('uuid');

var parser = require('../lib/parser');

var CONFIG_PATH = './test/etc/enroute.json';
var BAD_CONFIG_PATH = './test/etc/badEnroute.json';
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

describe('enroute-parser', function () {
    it('should parse config from file', function (done) {
        parser.parse({
            version: 1,
            configPath: CONFIG_PATH
        }, function (err, config) {
            assert.ifError(err);
            assert.isNotNull(config);
            return done();
        });
    });

    it('should parse config from string', function (done) {
        parser.parse({
            version: 1,
            config: CONFIG
        }, function (err, config) {
            assert.ifError(err);
            assert.deepEqual(CONFIG, config);
            return done();
        });
    });

    it('should error if no file', function (done) {
        parser.parse({
            configPath: uuid.v4()
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if file not JSON', function (done) {
        parser.parse({
            configPath: BAD_CONFIG_PATH
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if no schemaVersion', function (done) {
        var config = _.cloneDeep(CONFIG);
        delete config.schemaVersion;

        parser.parse({
            config: config
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if no schemaVersion not number', function (done) {
        var config = _.cloneDeep(CONFIG);
        config.schemaVersion = '1';

        parser.parse({
            config: config
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if no schemaVersion not supported', function (done) {
        var config = _.cloneDeep(CONFIG);
        config.schemaVersion = 2;

        parser.parse({
            config: config
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if no routes object', function (done) {
        var config = _.cloneDeep(CONFIG);
        delete config.routes;

        parser.parse({
            config: config
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if empty routes object', function (done) {
        var config = _.cloneDeep(CONFIG);
        config.routes = {};

        parser.parse({
            config: config
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if route contains no methods', function (done) {
        var config = _.cloneDeep(CONFIG);
        config.routes = {
            foo: {}
        };

        parser.parse({
            config: config
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if route is not an object', function (done) {
        var config = _.cloneDeep(CONFIG);
        config.foo = 'not-an-object';

        parser.parse({
            config: config
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if route contains invalid HTTP method', function (done) {
        var config = _.cloneDeep(CONFIG);

        config.routes.foo.foo = {
            source: 'foo'
        };

        parser.parse({
            config: config
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if route does not contain source', function (done) {
        var config = _.cloneDeep(CONFIG);

        config.routes.foo.post = {};

        parser.parse({
            config: config
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if route contains other props', function (done) {
        var config = _.cloneDeep(CONFIG);

        config.routes.foo.post.foo = 'foo';

        parser.parse({
            config: config
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });
});
