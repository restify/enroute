'use strict'

module.exports = function fooDelete(req, res, next) {
    res.header('name', 'foo');
    res.header('method', 'del');
    res.send(200);
    next();
};
