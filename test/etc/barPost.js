'use strict'

module.exports = function barPost(req, res, next) {
    res.header('name', 'bar');
    res.header('method', 'post');
    res.send(200);
    next();
};
