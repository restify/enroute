'use strict'

module.exports = function barHead(req, res, next) {
    res.header('name', 'bar');
    res.header('method', 'head');
    res.send(200);
    next();
};
