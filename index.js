'use strict';

var https = require('https');
var SlackRobot = require('slack-robot');
var axios = require('axios');
var OpenCC = require('opencc');
var opencc = new OpenCC('s2t.json');
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
    if (dictMatch) {
        var word = dictMatch[1].trim();

        axios.get(dictUri + encodeURIComponent(word))
        .then(function (response) {
            var dictResult = response.data.match(/<span\sclass="trans"[^<>]*>([\s\S]*?)<\/span>/g)[0];
            var dictResult = dictResult.replace(/<\/?[^>]+(>|$)/g, "").trim();
            console.log(dictResult);
            res.text('查詢結果: ' + dictResult).send();
            return;
        })
        .catch(function (error) {
            console.log(error);
        });
    }

    axios.post(tulingUri + encodeURIComponent(msg))
        .then(function (response) {
            var converted = opencc.convertSync(response.data.text);
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