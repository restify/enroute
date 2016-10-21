'use strict';

var _ = require('lodash');
var assert = require('chai').assert;

var parser = require('../lib/parser');

var CONFIG_PATH = './test/etc/enroute.json';
var CONFIG = {
    schemaVersion: 1,
    endpoint: {
        get: {
            source: './lib/system/index.js'
        },
        post: {
            source: './lib/system/index.js'
        }
    },
    shadow: {
        get: {
            source: './lib/shadow/index.js'
        },
        post: {
            source: './lib/shadow/index.js'
        }
    }
};

describe('enroute-config', function() {
    it('should parse config from file', function(done) {
        parser.parse({
            version: 1,
            path: CONFIG_PATH
        }, function(err, config) {
            assert.ifError(err);
            assert.isNotNull(config);
            return done();
        });
    });

    it('should parse config from string', function(done) {
        parser.parse({
            version: 1,
            data: CONFIG
        }, function(err, config) {
            assert.ifError(err);
            assert.deepEqual(CONFIG, config);
            return done();
        });
    });

    it('should error if no schemaVersion', function(done) {
        var config = _.cloneDeep(CONFIG);
        delete config.schemaVersion;

        parser.parse({
            data: config
        }, function(err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if no schemaVersion not number', function(done) {
        var config = _.cloneDeep(CONFIG);
        config.schemaVersion = '1';

        parser.parse({
            data: config
        }, function(err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if no schemaVersion not supported', function(done) {
        var config = _.cloneDeep(CONFIG);
        config.schemaVersion = 2;

        parser.parse({
            data: config
        }, function(err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if route is not an object', function(done) {
        var config = _.cloneDeep(CONFIG);
        config.endpoint = 'not-an-object';

        parser.parse({
            data: config
        }, function(err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if route contains invalid HTTP method', function(done) {
        var config = _.cloneDeep(CONFIG);

        config.endpoint.foo = {
            source: 'foo'
        };

        parser.parse({
            data: config
        }, function(err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if route does not contain source', function(done) {
        var config = _.cloneDeep(CONFIG);

        config.endpoint.post = { };

        parser.parse({
            data: config
        }, function(err) {
            assert.isOk(err);
            return done();
        });
    });

    it('should error if route contains other props', function(done) {
        var config = _.cloneDeep(CONFIG);

        config.endpoint.post.foo = 'foo';

        parser.parse({
            data: config
        }, function(err) {
            assert.isOk(err);
            return done();
        });
    });
});
