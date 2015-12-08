'use strict';


var assert = require('chai').assert;
var testHelper = require('../../../../../lib/testHelper.js');
var actions = [];
function posttest(req, res, next) {
    assert(req.body, 'test post', 'receiving post body');
    res.send(200, {data : 'post succeed'});
    return next();
}
actions = actions.concat(testHelper.preMiddleware());
actions.push(posttest);
actions = actions.concat(testHelper.postMiddleware());

module.exports = actions;
