var Promise = require('q').Promise;

var rpad = function(s, width) {
  var padding = ' ';
  for (var i = 0; i < width - s.length; i++) {
    padding += ' ';
  };
  return s + padding;
};

var print = function(parsed) {
  var statusMaxWidth = parsed.activities.reduce(function(max, a) {
    return Math.max(max, a);
  }, 0) + '[]'.length;

  console.log(parsed.date);

  parsed.activities.reverse()
  .filter(function(activity) {
    return activity.status === 'closed' || activity.status === 'in-progress';
  })
  .forEach(function(activity) {
    var msg = [
      // activiti.datetime,
      activity.time,
      rpad('[' + activity.status + ']', statusMaxWidth),
      activity.key,
      activity.issue.summary,
      // activity.desc
    ].join('\t')
    console.log(msg);
  });
};

module.exports = function(parsed) {
  return new Promise(function(resolve, reject) {
    resolve(print(parsed));
  });
};

