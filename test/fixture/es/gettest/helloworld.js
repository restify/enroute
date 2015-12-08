'use strict';


function hello(req, res, next) {
    res.send(200, {data : 'Hello world!'});
    return next();
}

module.exports = hello;
