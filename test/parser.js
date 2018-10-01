'use strict';

var path = require('path');

var _ = require('lodash');
var assert = require('chai').assert;
var uuid = require('uuid');

var enroute = require('../lib');

var CONFIG_PATH = './test/etc/enroute.json';
var BAD_CONFIG_PATH = './test/etc/badEnroute.json';
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
            config: CONFIG,
            basePath: BASEPATH
        }, function (err, config) {
            assert.ifError(err);
            assert.deepEqual(config, {
                validatedConfig: CONFIG,
                basePath: BASEPATH
            } );
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
            config: config,
            basePath: BASEPATH
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if schemaVersion not number', function (done) {
        var config = _.cloneDeep(CONFIG);
        config.schemaVersion = '1';

        enroute.validate({
            config: config,
            basePath: BASEPATH
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if schemaVersion not supported', function (done) {
        var config = _.cloneDeep(CONFIG);
        config.schemaVersion = 3;

        enroute.validate({
            config: config,
            basePath: BASEPATH
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if no routes object', function (done) {
        var config = _.cloneDeep(CONFIG);
        delete config.routes;

        enroute.validate({
            config: config,
            basePath: BASEPATH
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if empty routes object', function (done) {
        var config = _.cloneDeep(CONFIG);
        config.routes = {};

        enroute.validate({
            config: config,
            basePath: BASEPATH
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
            config: config,
            basePath: BASEPATH
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if route is not an object', function (done) {
        var config = _.cloneDeep(CONFIG);
        config.foo = 'not-an-object';

        enroute.validate({
            config: config,
            basePath: BASEPATH
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
            config: config,
            basePath: BASEPATH
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if route does not contain source', function (done) {
        var config = _.cloneDeep(CONFIG);

        config.routes.foo.post = {};

        enroute.validate({
            config: config,
            basePath: BASEPATH
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if route contains other props', function (done) {
        var config = _.cloneDeep(CONFIG);

        config.routes.foo.post.foo = 'foo';

        enroute.validate({
            config: config,
            basePath: BASEPATH
        }, function (err) {
            assert.isOk(err);
            return done();
        });
    });
});
