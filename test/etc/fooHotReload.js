'use strict'

module.exports = function fooGet(req, res, next) {
    res.header('name', 'foo');
    res.header('method', 'get');
    res.header('reload', 'yes');
    res.send(200);
    next();
};
