'use strict'

module.exports = function fooPut(req, res, next) {
    res.header('name', 'foo');
    res.header('method', 'put');
    res.send(200);
    next();
};
