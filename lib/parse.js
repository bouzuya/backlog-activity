var Promise = require('q').Promise;
var cheerio = require('cheerio');
var moment = require('moment');
var backlogApi = require('backlog-api');

var parseDate = function($table) {
  var $caption = $table.find('caption');
  var caption = moment($caption.text().replace(/\(.\)/, ''), 'YYYY年M月D日');
  var date = caption.format('YYYY-MM-DD');
  return date;
};

// NOTE:
//   td.ico
//     div.update
//     div.issue
//     div.comment
//   td.key / td.key.list
//   td.desc
//     span
//     span[style]
//   td.updated
var parseActivity = function($activity, date) {
  var activity = {};

  var $ico = $activity.find('td[class="ico"] div').first();
  activity.ico = $ico.attr('class');

  var $key = $activity.find('td[class="key"]').first();
  activity.key = $key.text().replace(new RegExp('\\s*', 'g'), '');

  // まとめて編集のものは扱わない(td[class="key list"])
  if (activity.key.length === 0) {
    return null;
  }

  var $desc = $activity.find('td[class="desc"]');

  var $tags = $desc.find('span[style]').first();
  activity.tags = parseTags($tags);

  $desc.find('span[style]').remove();
  activity.desc = $desc.text().replace(new RegExp('\\s*', 'g'), '');

  var $updated = $activity.find('td[class="updated"]').first();
  var time = $updated.text();
  activity.time = time;
  activity.datetime = date + 'T' + time + ':00+09:00';

  activity.status = activity.tags.some(function(tag) {
    return tag.name === '状態' && tag.value === '完了';
  }) ? 'closed' : activity.tags.some(function(tag) {
    return tag.name === '状態' && tag.value === '処理中';
  }) ? 'in-progress' : activity.tags.some(function(tag) {
    return tag.name === '状態' && tag.value === '処理済み';
  }) ? 'resolved' : activity.ico === 'issue' ? 'open' : '';

  return activity;
};

var parseTags = function($tags) {
  var s = $tags.text();
  var tags = [];
  var re = new RegExp('\s*\\[ ([^:]+): (.*?) \\]\s*', 'g');
  var match = re.exec(s);
  while (match) {
    tags.push({ name: match[1], value: match[2] });
    match = re.exec(s);
  }
  return tags;
};

var parse = function(html) {
  var $ = cheerio.load(html); 
  var $table = $('#bodyRightInner table').first();
  var date = parseDate($table);

  var activities = [];
  $table.find('tr').each(function() {
    var $activity = $(this);
    var activity = parseActivity($activity, date);
    if (activity) {
      activities.push(activity);
    }
  });

  return { date: date, activities: activities };
};

var mapSeries = function(arr, f) {
  return arr.reduce(function(promise, i) {
    return promise.then(function() { return f(i); });
  }, new Promise(function(resolve) { resolve(); }));
};

module.exports = function(html) {
  return new Promise(function(resolve, reject) {
    var parsed = parse(html);
    var backlog = backlogApi(); // use process.env.*
    mapSeries(parsed.activities, function(activity) {
      return backlog.getIssue({
        issueKey: activity.key
      }).then(function(issue) {
        activity.issue = issue;
        return new Promise(function(resolve) {
          setTimeout(function() { resolve(); }, 100);
        });
      });
    }).then(function() {
      resolve(parsed);
    });
  });
};
