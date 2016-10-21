# restify-enroute
This module provides configuration driven route installation for restify.
Instead of having to declare routes in code, you can create a confiuration file
like this:

```json
{
    "schemaVersion": 1,
    "foo": { // route name
        "get": { // HTTP method
            "source": "./test/etc/fooGet.js" // path to handler source
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
```
this declares the route name, http method, and handler file on disk. this
module will install these routes onto a restify server for you. The
corresponding handler file would look like:

```javascript
module.exports = function handler(req, res, next) {
    res.send(200, 'Hello World');
    next()
};
```

## API
Synopsis: `enroute(opts, cb)`

Installs routes as defined in opts into a restify server, invokes the callback
when done.
* `opts`: The options object containing
    * `opts.server` The restify server to install the routes on to.
    * `opts.config` The POJO of the enroute config.
    * `opts.configPath` The path to the enroute config on disk.
* `cb` The callback. Returns `Error` if there's an issue installing the routes.

Note only one of `opts.config` or `opts.configPath` is needed. The module will
either read in the file from disk, or use a pre-populated POJO.

### Example
```javascript
const enroute = require('restify-enroute');
const restify = require('restify');
const CONFIG = {
    schemaVersion: 1,
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
};

const server = restify.createServer();
// install routes with enroute
enroute({
    config: CONFIG,
    server: server
}, function (err) {
    if (err) {
        console.error('unable to install routes');
    } else {
        console.log('routes installed');
        SERVER.listen(8080);
    }
});
```
