'use strict';

var _ = require('lodash');
var assert = require('chai').assert;
var uuid = require('uuid');

var enroute = require('../lib');

var CONFIG_PATH = './test/etc/enroute.json';
var BAD_CONFIG_PATH = './test/etc/badEnroute.json';
var CONFIG = {
    schemaVersion: 1,
    basePath: './test',
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

describe('enroute-parser', function () {
    it('should parse config from file', function (done) {
        enroute.validate({
            version: 1,
            configPath: CONFIG_PATH
        }, function (err, config) {
            assert.ifError(err);
            assert.isNotNull(config);
            return done();
        });
    });

    it('should parse config from string', function (done) {
        enroute.validate({
            version: 1,
            config: CONFIG
        }, function (err, config) {
            assert.ifError(err);
            assert.deepEqual(CONFIG, config);
            return done();
        });
    });

    it('should error if no file', function (done) {
        enroute.validate({
            configPath: uuid.v4()
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if file not JSON', function (done) {
        enroute.validate({
            configPath: BAD_CONFIG_PATH
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if no schemaVersion', function (done) {
        var config = _.cloneDeep(CONFIG);
        delete config.schemaVersion;

        enroute.validate({
            config: config
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if no schemaVersion not number', function (done) {
        var config = _.cloneDeep(CONFIG);
        config.schemaVersion = '1';

        enroute.validate({
            config: config
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if no schemaVersion not supported', function (done) {
        var config = _.cloneDeep(CONFIG);
        config.schemaVersion = 2;

        enroute.validate({
            config: config
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if no routes object', function (done) {
        var config = _.cloneDeep(CONFIG);
        delete config.routes;

        enroute.validate({
            config: config
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if empty routes object', function (done) {
        var config = _.cloneDeep(CONFIG);
        config.routes = {};

        enroute.validate({
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

        enroute.validate({
            config: config
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if route is not an object', function (done) {
        var config = _.cloneDeep(CONFIG);
        config.foo = 'not-an-object';

        enroute.validate({
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

        enroute.validate({
            config: config
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if route does not contain source', function (done) {
        var config = _.cloneDeep(CONFIG);

        config.routes.foo.post = {};

        enroute.validate({
            config: config
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if route contains other props', function (done) {
        var config = _.cloneDeep(CONFIG);

        config.routes.foo.post.foo = 'foo';

        enroute.validate({
            config: config
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });
});
