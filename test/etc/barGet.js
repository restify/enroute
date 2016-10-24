'use strict'

module.exports = function barGet(req, res, next) {
    res.header('name', 'bar');
    res.header('method', 'get');
    res.send(200);
    next();
};
