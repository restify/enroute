'use strict'

some invalid syntax

module.exports = function syntaxErrorGet(req, res, next) {
  res.header('method', 'get');
  res.send(200);
  next();
};
