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

## Cutting a release

Releases are automated with [release-please](https://github.com/googleapis/release-please) and published to npm via GitHub Actions. We use [Conventional Commits](http://conventionalcommits.org/) to simplify the process of managing semver on this project — release-please parses commit types (`fix`, `feat`, etc.) to determine the version bump.

### Release flow

1. Merge pull requests to `main` using [Conventional Commits](http://conventionalcommits.org/).
2. `release-please` opens or updates a **Release PR** with the version bump and changelog.
3. Review and merge the Release PR when ready to ship.
4. `release-please` creates a GitHub Release and version tag (for example `v6.3.0`).
5. The same `release-please` run then dispatches `npm-publish` with that tag. It re-runs tests, validates the package contents (`npm pack --dry-run`), then pauses at the `Publish` environment for reviewer approval.
6. After approval, the package is published to npm via [Trusted Publishing](https://docs.npmjs.com/trusted-publishers) (OIDC).

Release candidates follow the same path: merging an RC PR tags an `-rc` version, `npm-publish` publishes it with `--tag rc`, and `release-please` then opens a stable Release PR.

### Dry run

To validate the publish workflow without publishing, run **Actions → npm-publish → Run workflow** and leave `tag` empty. This runs tests and `npm pack --dry-run`, and skips the publish job.

### Retrying a failed run

If `npm-publish` fails, use **Re-run jobs** on the failed run itself (Actions tab) — it replays the same tag, so there's no need to cut a new one. You can also re-run **Actions → npm-publish → Run workflow** with the same `tag`. Either is safe even if `publish` partially ran, since `validate` checks whether the version is already on npm before continuing.
