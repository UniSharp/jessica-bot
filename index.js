'use strict';

var https = require('https');
var SlackRobot = require('slack-robot');
var axios = require('axios');
var OpenCC = require('opencc');
var openTW = new OpenCC('s2twp.json');
var openCN = new OpenCC('tw2sp.json');
var _ = require('lodash');
var config = require('./config');
var robot = new SlackRobot(config.slackKey);
var tulingKey = config.tulingKey;
var tulingUser = config.tulingUser;
var tulingUri = 'http://www.tuling123.com/openapi/api?key=' + tulingKey + '&userid=' + tulingUser + '&info=';
var dictUri = 'http://dictionary.cambridge.org/zht/%E8%A9%9E%E5%85%B8/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/';

// will post 'world' text as bot when receiving 'hello' message
// in channel, group, or direct message
robot.listen(/.*/, function (req, res) {
    if (!req.message || !req.message.value) {
        console.log("no message");
        return;
    }

    var msg = req.message.value.text;
    msg = msg.replace(/@?jessica:?/i, '').trim();
    console.log('got:"' + msg + '"');

    if (req.message.value.mentioned != true && req.to.type != 'dm') {
        console.log('skipped');
        return;
    }

    var dictMatch = msg.match(/^字典(.*)/);
    var exchangeMatch = msg.match(/^交換禮物(.*)/);
    var drawMatch = msg.match(/^籤筒(.*)/);
    if (dictMatch) {
        var word = dictMatch[1].trim();

        axios.get(dictUri + encodeURIComponent(word))
        .then(function (response) {
            var dictResult = response.data.match(/<span\sclass="trans"[^<>]*>([\s\S]*?)<\/span>/g);
            if (!dictResult) {
                console.log('no word found on dictionary');
                res.text('字典中找不到: `' + word + '` 這個字').send();
            } else {
                var dictResult = dictResult[0].replace(/<\/?[^>]+(>|$)/g, "").trim();
                console.log(dictResult);
                res.text('查詢結果: ' + dictResult).send();
            }
        })
        .catch(function (error) {
            console.log(error);
        });
        return;
    } else if (exchangeMatch) {
        var members = config.members;
        var list =  _.clone(members);
        _.forEach(members, function(value, key) {
          let draw = list.filter(function(x) {
            return x !== value;
          });
          var result = _.sample(draw);
          _.pull(list, result);
          // console.log(value + ': ' + result)
          res.text('你的小主人是 => `' + result + '`', '@' + value).send();
        })
        return;
    } else if (drawMatch) {
        var result = _.sample(config.members);

        res.text('抽籤結果: `' + result + '`').send();
        return;
    }

    axios.post(tulingUri + encodeURIComponent(openCN.convertSync(msg)))
        .then(function (response) {
            var converted = openTW.convertSync(response.data.text);
            res.text(converted).send();
            console.log(converted);
        })
        .catch(function (error) {
            console.log(error);
        });
});

// ignore message from '#general' channel, even if it matches the listener
robot.ignore('#general');

// start listening
robot.start();