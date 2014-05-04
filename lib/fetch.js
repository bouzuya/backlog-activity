var Promise = require('q').Promise;
var phantom = require('phantom');

var fetch = function(options, callback) {
  var spaceId = options.spaceId;
  var username = options.username;
  var password = options.password;

  var urlRoot = 'https://' + spaceId + '.backlog.jp';
  phantom.create(function(ph) {
    ph.createPage(function(page) {

      var onLoadedLoginPage = function() {
        var options = {
          username: username,
          password: password
        };
        page.evaluate(function(options) {
          var form = document.getElementById('Login');
          var userId = document.getElementById('userId');
          var password = document.getElementById('password');
          userId.value = options.username;
          password.value = options.password;
          form.submit.click();
        }, null, options);
      };

      var onLoadedMyPage = function() {
        var userPageUrl = urlRoot + '/user/' + username;
        page.open(userPageUrl);
      };

      var onLoadedUserPage = function() {
        // wait fetch activities
        setTimeout(function() {
          page.evaluate(function() {
            return document.body.innerHTML;
          }, function(result) {
            ph.exit();
            callback(result);
          });
        }, 4000);
      };

      // set loaded handler
      var step = 0;
      page.set('onLoadFinished', function(status) {
        [
          onLoadedLoginPage,
          onLoadedMyPage,
          onLoadedUserPage,
        ][step]();
        step += 1;
      });

      // load login page
      var loginPageUrl = urlRoot + '/LoginDisplay.action';
      return page.open(loginPageUrl);
    });
  });
};

module.exports = function(options) {
  return new Promise(function(resolve, reject) {
    fetch(options, resolve);
  });
};
