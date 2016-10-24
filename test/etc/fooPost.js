'use strict'

module.exports = function fooPost(req, res, next) {
    res.header('name', 'foo');
    res.header('method', 'post');
    res.send(200);
    next();
};
