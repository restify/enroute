'use strict'

module.exports = function fooOptions(req, res, next) {
    res.header('name', 'foo');
    res.header('method', 'opts');
    res.send(200);
    next();
};
