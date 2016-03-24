'use strict';


var assert = require('chai').assert;
var actions = [];
function posttest(req, res, next) {
    assert(req.body, 'test post', 'receiving post body');
    res.send(200, {data : 'post succeed'});
    return next();
}
actions.push(posttest);

module.exports = actions;
