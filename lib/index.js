var Promise = require('q').Promise;
var fetch = require('./fetch');
var parse = require('./parse');
var print = require('./print');

var CLI = function() {};

CLI.prototype.run = function() {
  new Promise(function(resolve) {
    var options = {
      spaceId:  process.env.BACKLOG_SPACE_ID,
      username: process.env.BACKLOG_USERNAME,
      password: process.env.BACKLOG_PASSWORD,
    };
    resolve(options);
  })
  .then(function(o) {
    if (!o.spaceId)  throw new Error('export BACKLOG_SPACE_ID');
    if (!o.username) throw new Error('export BACKLOG_USERNAME');
    if (!o.password) throw new Error('export BACKLOG_PASSWORD');
    return o;
  })
  .then(fetch)
  .then(parse)
  .then(print)
  .catch(function(err) {
    console.error(err);
  });
};

module.exports = function() {
  return new CLI();
};

