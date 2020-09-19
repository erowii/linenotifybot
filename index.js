// const express = require('express')
// const path = require('path')
// const PORT = process.env.PORT || 5000

// express()
//   .use(express.static(path.join(__dirname, 'public')))
//   .set('views', path.join(__dirname, 'views'))
//   .set('view engine', 'ejs')
//   .get('/', (req, res) => res.render('pages/index'))
//   .listen(PORT, () => console.log(`Listening on ${ PORT }`))

// const http = require("http");
// const linebot = require("linebot");

// const port = process.env.PORT || 5000;

// const server = http.createServer((req, res) => {
// 	res.statusCode = 200;
// 	res.setHeader("Content-Type", "text/plain");
// 	res.end("Hello World\n");
// });

// server.listen(port);

// var bot = linebot({
// 	channelId: '1654940136',
// 	channelSecret: '8a4dcd0f2983e9b2e9d2b9db43517803',
// 	channelAccessToken: 'QbmZPCahmyMALl+M34eFPfiPtYrFtmFtC6K9SRM7ZhnWdAJGB/50V5YYZLuUCkFvXnFk29r5yHqQdCQnfe0IoYKQLekJ9muHefED4CI6ohfdNcrMioLPwpSdtYOJRbXHuPJtfE7/I/P6wtvSNm3ypQdB04t89/1O/w1cDnyilFU='
// });

// bot.on('message', function (event) {
// 	// event.message.text是使用者傳給bot的訊息
// 	// 使用event.reply(要回傳的訊息)方法可將訊息回傳給使用者
// 	event.reply(event.message.text).then(function (data) {
// 	  // 當訊息成功回傳後的處理
// 	}).catch(function (error) {
// 	  // 當訊息回傳失敗後的處理
// 	});
// });

// // Bot所監聽的webhook路徑與port
// bot.listen('/linewebhook', 3000, function () {
//     console.log('[BOT已準備就緒]');
// });

let linebot = require('linebot');

// 初始化 line bot 需要的資訊，在 Heroku 上的設定的 Config Vars，可參考 Step2
let bot = linebot({
	channelId: process.env.channelId,
	channelSecret: process.env.channelSecret,
	channelAccessToken: process.env.channelAccessToken
});

// 當有人傳送訊息給 Bot 時
bot.on('message', function (event) {
  // 回覆訊息給使用者 (一問一答所以是回覆不是推送)
  event.reply(`你說了 ${event.message.text}`);
});

// Bot 所監聽的 webhook 路徑與 port，heroku 會動態存取 port 所以不能用固定的 port，沒有的話用預設的 port 5000
bot.listen('/', process.env.PORT || 5000, function () {
  console.log('全國首家LINE線上機器人上線啦！！');
});