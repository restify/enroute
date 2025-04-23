'use strict'

// simulate a misbehaving bundler

function fakeEsmGet(req, res, next) {
  res.header('name', 'fakeEsm');
  res.header('method', 'get');
  res.send(200);
  next();
}
fakeEsmGet.__esModule = true;
fakeEsmGet.default = 'not a function';

module.exports = fakeEsmGet;