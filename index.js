//API 
// https://www.npmjs.com/package/linebot
// https://www.npmjs.com/package/axios
console.log("ver:1");
const linebot = require('linebot');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

// 初始化 line bot 需要的資訊，在 Heroku 上的設定的 Config Vars，可參考 Step2
var bot;
if (process && process.env) {
    bot = linebot({
        channelId: process.env.channelId,
        channelSecret: process.env.channelSecret,
        channelAccessToken: process.env.channelAccessToken
    });
} else {
    bot = linebot({
        channelId: "1654940136",
        channelSecret: "8a4dcd0f2983e9b2e9d2b9db43517803",
        channelAccessToken: "QbmZPCahmyMALl+M34eFPfiPtYrFtmFtC6K9SRM7ZhnWdAJGB/50V5YYZLuUCkFvXnFk29r5yHqQdCQnfe0IoYKQLekJ9muHefED4CI6ohfdNcrMioLPwpSdtYOJRbXHuPJtfE7/I/P6wtvSNm3ypQdB04t89/1O/w1cDnyilFU="
    });
}


const app = express();

const parser = bodyParser.json({
    verify: function(req, res, buf, encoding) {
        req.rawBody = buf.toString(encoding);
    }
});

app.use(bodyParser.urlencoded({ extended: false }));

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    next();
}

app.use(allowCrossDomain);

app.get('/', function(req, res) {
    res.send('hello world');
});

app.get('/api/keepalive', function(req, res) {
    console.log("keepalive id: " + req.query.id);
    res.json({ success: true });
});

app.post('/api/onsale', function(req, res) {
    console.log("req", req.body);
    if (req.body && req.body.msg) {
        var msg = {
            "type": "text",
            "text": req.body.msg
        };
        if (req.body.lineId) {
            bot.push(req.body.lineId, msg);
        } else {
            bot.broadcast(msg);
        }
    }
    res.json({ success: true });
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
    if (event.message.text.includes("監控")) {
        var prodId = event.message.text.replace("監控", "");
        getProdButtonStateAndQty(prodId).then((res) => {
            if (res != null && res.ButtonType) {
                var msg = "";
                switch (res.ButtonType) {
                    case 'ForSale':
                        msg = `${res.Name} 開賣啦! 快去搶購 \n數量:${res.Qty}`;
                        break;
                    case 'OrderRefill':
                        msg = `${res.Name} 賣完惹，下次請早`;
                        break;
                    case 'NotReady':
                        msg = `${res.Name} 尚未開賣`;
                        break;
                }
                event.reply(msg);
            } else {
                event.reply(`找不到該商品!`);
            }
        });
    } else {
        // 回覆訊息給使用者 (一問一答所以是回覆不是推送)
        // event.reply(`你說了 ${event.message.text}`);
        event.reply(`沒有該指令`);
    }
});

app.listen(process.env.PORT || 5000, function() {
    console.log('LineBot is running.');
});


//PCHOME API
// getProdButtonStateAndQty("DGBJGB-A900AVK52").then(console.log);

/*取得產品按鈕狀態與數量 by prodId
return {
	Id: 'DGCK2K-A900AUJDK-000',
	ButtonType: 'NotReady', 'OrderRefill' 'ForSale'
	Qty: 0,
	Name: 'PlayStation 5 數位版主機 (PS5 Digital Edition)'
}
*/
async function getProdButtonStateAndQty(prodId) {
    try {
        var res = await axios.get(`https://24h.pchome.com.tw/ecapi/ecshop/prodapi/v2/prod/button&id=${prodId}&fields=Id,ButtonType,Qty?=${Date.now()}`)
        if (res.data && res.data.length > 0) {
            var name = await getProdName(prodId);
            if (name != null) {
                res.data[0]["Name"] = name;
            }
            return res.data[0];
        } else {
            return null;
        }
    } catch (error) {
        console.error(error);
        return null;
    }
}
//取得場品中文名稱 by prodId
async function getProdName(prodId) {
    try {
        var res = await axios.get(`https://ecapi.pchome.com.tw/ecshop/prodapi/v2/prod/${prodId}&fields=Name&_callback=()=>&${Date.now()}`)
        if (res.data && res.data[prodId + "-000"]) {
            return res.data[prodId + "-000"].Name;
        } else {
            return null;
        }
    } catch (error) {
        console.error(error);
        return null;
    }
}