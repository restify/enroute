'use strict'

module.exports = function fooHead(req, res, next) {
    res.header('name', 'foo');
    res.header('method', 'head');
    res.send(200);
    next();
};
