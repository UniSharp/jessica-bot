'use strict';

var https = require('https');
var SlackRobot = require('slack-robot');
var axios = require('axios');
var OpenCC = require('opencc');
var opencc = new OpenCC('s2t.json');
var config = require('./config');
var robot = new SlackRobot(config.slackKey);
var tulingKey = config.tulingKey;
var tulingUri = 'http://www.tuling123.com/openapi/api?key=' + tulingKey + '&info=';

// will post 'world' text as bot when receiving 'hello' message
// in channel, group, or direct message
robot.listen(/.*/, function (req, res) {
    if (!req.message || !req.message.value) {
        console.log("no message");
        return;
    }

    var msg = req.message.value.text;

    if (req.to && req.to.type != 'dm') {
        if (msg.match(/=/) && req.message.value.mentioned != true) {
            console.log("skip " + msg);
            return; // Group chat 不處理帶有 = 的語句
        }
    }
    msg = msg.replace(/@?jessica:?/i, '').trim();
    console.log('got:"' + msg + '"');

    if (req.message.value.mentioned != true) {
        if (req.to.type != 'dm') {
            // 2% 的機率亂入
            if (Math.floor((Math.random() * 100) + 1) < 99) {
                console.log("skip: " + msg);
                return;
            }
        }
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