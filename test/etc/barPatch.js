'use strict'

module.exports = function barPatch(req, res, next) {
    res.header('name', 'bar');
    res.header('method', 'patch');
    res.send(200);
    next();
};
