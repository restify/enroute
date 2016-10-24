'use strict'

module.exports = function barPut(req, res, next) {
    res.header('name', 'bar');
    res.header('method', 'put');
    res.send(200);
    next();
};
