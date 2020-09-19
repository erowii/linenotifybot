//API https://www.npmjs.com/package/linebot
const linebot = require('linebot');
const express = require('express');
const bodyParser = require('body-parser');

// 初始化 line bot 需要的資訊，在 Heroku 上的設定的 Config Vars，可參考 Step2
const bot = linebot({
    channelId: process.env.channelId,
    channelSecret: process.env.channelSecret,
    channelAccessToken: process.env.channelAccessToken
});

const app = express();

const parser = bodyParser.json({
    verify: function(req, res, buf, encoding) {
        req.rawBody = buf.toString(encoding);
    }
});

var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  next();
}

app.use(allowCrossDomain)

app.get('/', function(req, res) {
    res.send('hello world');
});

app.post('/api/onsale', function(req, res) {
	bot.broadcast({
	    "type": "text",
	    "text": JSON.stringify(req.body)
	});
    res.json({success: true});
});

app.post('/linewebhook', parser, function(req, res) {
    if (!bot.verify(req.rawBody, req.get('X-Line-Signature'))) {
        return res.sendStatus(400);
    }
    bot.parse(req.body);
    return res.json({});
});

// 當有人傳送訊息給 Bot 時
bot.on('message', function(event) {
    // 回覆訊息給使用者 (一問一答所以是回覆不是推送)
    event.reply(`你說了 ${event.message.text}`);
});

app.listen(process.env.PORT || 5000, function() {
    console.log('LineBot is running.');
});

// Bot 所監聽的 webhook 路徑與 port，heroku 會動態存取 port 所以不能用固定的 port，沒有的話用預設的 port 5000
// bot.listen('/linewebhook', process.env.PORT || 5000, function() {
//     console.log('全國首家LINE線上機器人上線啦！！');
// });

//line啟動時發送訊息
// bot.broadcast({
//     "type": "text",
//     "text": "LineBot Action!"
// });