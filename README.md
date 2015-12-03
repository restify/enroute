# enroute
restify route specification via JSON

# Example
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

Notice that the functions can be both defined within the endpoint script itself, but can also be a module. Critically, every function in the chain must invoke ```next()```, otherwise the request will hang.
