# restify-enroute
[![NPM Version](https://img.shields.io/npm/v/restify-enroute.svg)](https://npmjs.org/package/restify-enroute)
[![Build Status](https://github.com/restify/enroute/actions/workflows/test.yml/badge.svg)](https://github.com/restify/enroute/actions/workflows/test.yml)

This module provides configuration driven route installation for restify.
Instead of having to declare routes in code, you can create a configuration file
like this:

```json
{
    "schemaVersion": 1,
    "routes": {
        "foo": {
            "get": {
                "source": "./test/etc/fooGet.js"
            },
            "post": {
                "source": "./test/etc/fooPost.js"
            },
            "put": {
                "source": "./test/etc/fooPut.js"
            },
            "delete": {
                "source": "./test/etc/fooDelete.js"
            },
            "head": {
                "source": "./test/etc/fooHead.js"
            },
            "patch": {
                "source": "./test/etc/fooPatch.js"
            },
            "options": {
                "source": "./test/etc/fooOptions.js"
            }
        },
        "bar": {
            "get": {
                "source": "./test/etc/barGet.js"
            },
            "post": {
                "source": "./test/etc/barPost.js"
            }
        }
    }
}
```
This declares the route name, http method, and handler file on disk. this
module will install these routes onto a restify server for you. The
corresponding handler file would look like:

```javascript
module.exports = function handler(req, res, next) {
    res.send(200, 'Hello World');
    next()
};
```

## API
Synopsis: `install(opts, cb)`

Installs routes as defined in opts into a restify server, invokes the callback
when done.
* `opts`: The options object containing
    * `opts.server` The restify server to install the routes on to.
    * `[opts.config]` The POJO of the enroute config.
    * `[opts.basePath]` Used with `[opts.config]`. The POJO requires a
    `basePath` to correctly resolve the route source file(s).
    * `[opts.configPath]` The path to the enroute config on disk.
    * `[opts.hotReload]` Indicate whether you want the server to reload the
                         route from disk each time a request is served,
                         defaults to false
    * `[opts.excludePath]` The relative path to the basepath to exclude
                           reloaded routes
* `cb` The callback. Returns `Error` if there's an error installing the routes.

Note only one of `opts.config` or `opts.configPath` is needed. The module will
either read in the file from disk, or use a pre-populated POJO.

`opts.hotReload` allows the restify server to reload the route from disk each
time the request is processed. This is extremely slow and should only be used
in non-production instances.

### Example
```javascript
const enroute = require('restify-enroute');
const restify = require('restify');

const CONFIG = {
    schemaVersion: 1,
    routes: {
        foo: {
            get: {
                source: './test/etc/fooGet.js'
            },
            post: {
                source: './test/etc/fooPost.js'
            },
            delete: {
                source: './test/etc/fooDelete.js'
            },
            head: {
                source: './test/etc/fooHead.js'
            },
        }
    }
};

const server = restify.createServer();
// install routes with enroute
enroute.install({
    config: CONFIG,
    server: server,
    basePath: __dirname
}, function (err) {
    if (err) {
        console.error('unable to install routes');
    } else {
        console.log('routes installed');
        SERVER.listen(1337);
    }
});
```

Synopsis: `validate(opts, cb)`

Parse and validate a enroute config. This will verify that the config
is valid and return a POJO with the properties. Note only one of opts.config
or opts.configPath is needed.

* `opts` The options object containing
    * `[opts.config]` The POJO of the config you want to validate.
    * `[opts.configPath]` The path to the config on disk to validate.
* `cb` The callback f(err, validatedConfig). Returns `Error` if there's an
* error parsing or validating the config

### Example
```javascript
const enroute = require('restify-enroute');

const CONFIG = {
    schemaVersion: 1,
    routes: {
        foo: {
            get: {
                source: './test/etc/fooGet.js'
            },
            post: {
                source: './test/etc/fooPost.js'
            },
            delete: {
                source: './test/etc/fooDelete.js'
            },
            head: {
                source: './test/etc/fooHead.js'
            },
        }
    }
};

const server = restify.createServer();
// install routes with enroute
enroute.validate({
    config: CONFIG,
    basePath: __dirname
}, function (err) {
    if (err) {
        console.error('unable to install routes');
    } else {
        console.log('config successfully validated');
    }
});
```
