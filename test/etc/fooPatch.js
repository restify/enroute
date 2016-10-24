'use strict'

module.exports = function fooPatch(req, res, next) {
    res.header('name', 'foo');
    res.header('method', 'patch');
    res.send(200);
    next();
};
