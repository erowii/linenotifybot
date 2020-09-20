//API 
// https://www.npmjs.com/package/linebot
// https://www.npmjs.com/package/axios
console.log("ver:5 env:" + JSON.stringify(process.env));
const linebot = require('linebot');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');

// 初始化 line bot 需要的資訊，在 Heroku 上的設定的 Config Vars，可參考 Step2
var host = "";
var bot;
if (process && process.env) {
    bot = linebot({
        channelId: process.env.channelId,
        channelSecret: process.env.channelSecret,
        channelAccessToken: process.env.channelAccessToken
    });
    host = process.env.host;
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
app.use(express.static('public'));

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'content-type');
    next();
}

app.use(allowCrossDomain);

app.get('/', function(req, res) {
    res.send('hello world');
});

//保持連線用
app.get('/api/keepalive', function(req, res) {
    console.log("keepalive id: " + req.query.id);
    res.json({ success: true });
});

//購物車偵測到商品時用
/*
req.body:{
	lineId:string,
	msg:string
}
*/
app.post('/api/onsale', function(req, res) {
    console.log("onsale req", req.body);
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

//下單成功時使用
/*
req.body:{
	lineId:string,
	msg:string
}
*/
app.post('/api/onorder', function(req, res) {
    console.log("onorder req", req.body);
    if (req.body && req.body.msg && req.body.lineId) {
        var msg = {
            "type": "text",
            "text": req.body.msg
        };
        bot.push(req.body.lineId, msg);
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

//進入付款頁面時使用
/*
req.body:{
	lineId:string,
	url:string,
	img:string
}
*/
app.post('/api/payment', function(req, res) {
    console.log("payment req", req.body);
    if (req.body && req.body.url && req.body.lineId) {
        var msg = {
            type: "text",
            text: `有一筆LinePay訂單成立了! 付款連結:\n${req.body.url}`
        };
        //bot.push(req.body.lineId, msg);
        if (req.body.img) {
            saveImage(req.body.img, function(imageUrl) {
                console.log("Send Image", imageUrl);
                var msg2 = {
                    "type": "bubble",
                    "hero": {
                        "type": "image",
                        "url": imageUrl,
                        "size": "full",
                        "aspectRatio": "20:13",
                        "aspectMode": "cover",
                        "action": {
                            "type": "uri",
                            "uri": "http://linecorp.com/"
                        }
                    },
                    "body": {
                        "type": "box",
                        "layout": "vertical",
                        "contents": [{
                            "type": "text",
                            "text": "LinePay",
                            "weight": "bold",
                            "size": "xl"
                        }]
                    },
                    "footer": {
                        "type": "box",
                        "layout": "vertical",
                        "spacing": "sm",
                        "contents": [{
                            "type": "button",
                            "style": "link",
                            "height": "sm",
                            "action": {
                                "type": "uri",
                                "label": "付款",
                                "uri": req.body.url
                            }
                        }],
                        "flex": 0
                    }
                };
                // bot.push(req.body.lineId, msg2);
                //           var msg2 = {
                //               type: "template",
                //               altText: `有一筆LinePay訂單成立了! 付款連結:\n${req.body.url}`,
                //               template: {
                //                   type: "buttons",
                //                   text: "LinePay",
                //                   imageSize: "contain",
                //               	thumbnailImageUrl: path,
                //                   actions: [{  
                //  	type:"uri",
                //  	label:"付款",
                //  	uri: req.body.url
                // }]
                //               }
                //           }
                bot.push(req.body.lineId, msg2);
            });
        }
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
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
    console.log(`MessageEvent userId: ${event.source.userId}, message: ${event.message.text}`);
    var text = event.message.text;
    if (text.includes("/查詢產品")) {
        var prodId = event.message.text.replace("/查詢產品", "");
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
    } else if (text.includes("/查詢UserID")) {
        event.reply(event.source.userId);
    } else if (text.includes("/help")) {
        event.reply('/查詢產品+ProdID ex: /查詢產品DGBJGB-A900AVK52\n/查詢UserID');
    } else {
        // 回覆訊息給使用者 (一問一答所以是回覆不是推送)
        // event.reply(`你說了 ${event.message.text}`);
        event.reply(`/沒有該指令 輸入/help查詢指令`);
    }
});

app.listen(process.env.PORT || 5000, function() {
    console.log('LineBot is running.');
});

//saveImage('data:image/png;base64,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');
function saveImage(base64String, onComplete) {
    var base64Image = base64String.split(';base64,').pop();
    // var path = `public/images/image_${Date.now()}.png`;
    var path = `public/images/image.png`;
    console.log("saveImage", path);
    fs.writeFile(path, base64Image, { encoding: 'base64' }, function(err) {
        onComplete && onComplete(`${process.env.host}images/image.png`);
    });
}

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