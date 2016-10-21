'use strict'

module.exports = [ function arrayGetSetName(req, res, next) {
    res.header('name', 'array');
    next();
}, function arrayGetSetMethod(req, res, next) {
    res.header('method', 'get');
    res.send(200);
    next();
}];
