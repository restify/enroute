'use strict'

module.exports = function fooGet(req, res, next) {
    res.header('name', 'foo');
    res.header('method', 'get');
    res.send(200);
    next();
};
