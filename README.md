# enroute
This module provides convenience way to specify restify route in a declarative JSON format.
## Route Configuration file Example
```json
{
    "routes": {
        "acceptcookies": {
            "put": {
                "source": "./routes/putAcceptCookies.js"
            },
            "get": {
                "source": "./routes/getAcceptCookies.js"
            }
        },
        "accountInfo": {
            "get": {
                "source": "./routes/getAccountInfo.js"
            }
        },
        "cancelPlan": {
            "post": {
                "source": "./routes/postCancelPlan.js"
            }
        },
        "accountInfo/old": {
            "get": {
                "source": "./routes/getAccountInfoOld.js"
            }
        }
    }
}
```
The second level keys "acceptcookies", "accountInfo", "cancelPlan", "accountInfo/old" is url path.
The third level keys are HTTP method names.
The value of "source" is the route handler script's relative path from app root.


## Usage Example
```javascript
 enroute.createRoute({
            //restify server object
            server: server,
            //bunyan log object
            log: log,
            //array of route config object, the object includes route configuration file path
            //and an optional baseUrl String, it will be prepend
            //for every route path specified in route configuration file. user can also provide
            //route definition object directly by doing
            //routeConf: [{routeDefinitionObj : routeObj}],
            routeConf: [{filePath :  routeScriptRootPath + '/route.json'}],
            //user can specify an array of universal middleware function before all routes
            preMiddleware : preHandlerArr,
            //user can specify an array of universal middleware function after all routes
            postMiddleware : postMiddleware,
            //the root path of all route scripts, it can be different from route.json path
            scriptPath : routeScriptRootPath
        }, function() {
        //user can specify optional callback function
            client.get('/hello',
                function(err, req, res, obj) {
                if (err) {
                    done(err);
                }
                assert.equal(obj.data, 'Hello world!',
                          'Hello World endpoint response.');
                done();
            });
        });
    });
```
Routes can be injected into Restify server either before or after server start.


## Route Handler Script Example
```javascript
'use strict';
// Node core modules
var url = require('url');


// Third party modules specified in package.json
var _ = require('lodash');
var falcor = require('falcor');
var verror = require('verror');

function accountInfo(req, res, next) {
    var queryparams = req.queryParams;
    // bunyan logger
    var log = req.log;
    // metrics client;
    var metrics = req.metrics;
    // api client
    var apiClient = req.apiClient;

    // Make some api requests

    // send back response
    res.send(200);

    return next();
}

module.exports = accountInfo;
```
Route definitions must export as single function or an array of functions where the signature conforms to f(req, res, next). This is identical to writing a restify handler function. The req object contains request state, the api client, logging and metric clients that can be leveraged by the user land code in the endpoint script. The res object is used to send back the response to the client, and next() must be invoked when the script has completed.

Instead of a single function, route definitions can export an array of chained function handlers; increasing the modularity of their endpoint scripts.

```javascript
'use strict';
// Node core modules
var url = require('url');


// Third party modules specified in metadata dependencies/floatDependencies fields
var _ = require('lodash');
var falcor = require('falcor');
var verror = require('verror');

var postHandler = require('somePostHandler');


function somePreHandler(req, res, next) {
    return next();
}

function accountInfo(req, res, next) {
    var queryparams = req.queryParams;
    // bunyan logger
    var log = req.log;
    // metrics client;
    var metrics = req.metrics;
    // api client
    var apiClient = req.apiClient;

    // Make some api requests

    // send back response
    res.send(200);

    return next();
}

module.exports = [somePreHandler, accountInfo, postHandler];
```

Notice that the functions can be both defined within the script itself, but can also be a module. Critically, every function in the chain must invoke ```next()```, otherwise the request will hang.

