'use strict'

module.exports = function barOptions(req, res, next) {
    res.header('name', 'bar');
    res.header('method', 'opts');
    res.send(200);
    next();
};
