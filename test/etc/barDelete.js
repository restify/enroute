'use strict'

module.exports = function barDelete(req, res, next) {
    res.header('name', 'bar');
    res.header('method', 'del');
    res.send(200);
    next();
};
