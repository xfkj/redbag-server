'use strict';

var express = require('express');
var timeout = require('connect-timeout');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const request = require('request')
var AV = require('leanengine');

// 加载云函数定义，你可以将云函数拆分到多个文件方便管理，但需要在主文件中加载它们
require('./cloud');

var app = express();

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(express.static('static'));

// 设置默认超时时间
app.use(timeout('15s'));

// 加载云引擎中间件
app.use(AV.express());

app.enable('trust proxy');
// 需要重定向到 HTTPS 可去除下一行的注释。
app.use(AV.Cloud.HttpsRedirect());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


const {APP_ID, APP_SECRET} = require('./wx')

app.get('/', (req, res) => {
  if (req.cookies.openid) {
    res.sendFile('index.html', {root: __dirname + '/static/game/'})
  } else {
    if (!req.query.code) {
      res.redirect(
        'https://open.weixin.qq.com/connect/oauth2/authorize?'
        + 'appid=' + APP_ID
        + '&redirect_uri=https://redbag2.leanapp.cn'
        + '&response_type=code'
        + '&scope=snsapi_base'
        + '#wechat_redirect'
      )
    } else {
      request(
        'https://api.weixin.qq.com/sns/oauth2/access_token?'
        + 'appid=' + APP_ID
        + '&secret=' + APP_SECRET
        + '&code=' + req.query.code
        + '&grant_type=authorization_code', 
        (error, response, body) => {
          const openid = JSON.parse(body).openid
          if (openid) {
            res.cookie('openid', openid, {maxAge: 1000 * 3600 * 24 * 365})
            res.redirect('/')
          } else {
            res.send('系统忙，请稍后重试')
          }
        }
      )
    }
  } 
})

const fs = require('fs')
const xml = `
<xml>
<act_name>非凡发红包</act_name>
<client_ip>117.50.2.88</client_ip>
<mch_billno>REDBAG2</mch_billno>
<mch_id>1494533882</mch_id>
<nonce_str>FFJY2</nonce_str>
<re_openid>ogwQq1dwtjtWLANgde3MLKDsXZ8I</re_openid>
<remark>漫天红包快来拿!</remark>
<send_name>非凡教育</send_name>
<total_amount>100</total_amount>
<total_num>1</total_num>
<wishing>向奋斗者致敬!</wishing>
<wxappid>wx0691d24964171a10</wxappid>
<sign>73FDB4432D800F80AE5960E0289FEE1C</sign>
</xml>
`
app.get('/pay', (req, res) => {
  request.post({
    method: 'POST',
    url: 'https://api.mch.weixin.qq.com/mmpaymkttransfers/sendredpack',
    headers: {
      "content-type": "application/xml",
    },
    key: fs.readFileSync('./cert/apiclient_key.pem'), //证书
    cert: fs.readFileSync('./cert/apiclient_cert.pem'), //key
    body: xml,
  }, (error, response, body) => {
    console.log(body)
    res.end()
  })
})

app.get('/admin', (req, res) => {
  res.sendFile('index.html', {root: __dirname + '/static/admin/'})
})

app.use(function(req, res, next) {
  // 如果任何一个路由都没有返回响应，则抛出一个 404 异常给后续的异常处理器
  if (!res.headersSent) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  }
});

// error handlers
app.use(function(err, req, res, next) {
  if (req.timedout && req.headers.upgrade === 'websocket') {
    // 忽略 websocket 的超时
    return;
  }

  var statusCode = err.status || 500;
  if (statusCode === 500) {
    console.error(err.stack || err);
  }
  if (req.timedout) {
    console.error('请求超时: url=%s, timeout=%d, 请确认方法执行耗时很长，或没有正确的 response 回调。', req.originalUrl, err.timeout);
  }
  res.status(statusCode);
  // 默认不输出异常详情
  var error = {};
  if (app.get('env') === 'development') {
    // 如果是开发环境，则将异常堆栈输出到页面，方便开发调试
    error = err;
  }
  res.render('error', {
    message: err.message,
    error: error
  });
});

module.exports = app;
