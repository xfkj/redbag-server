const wx = require('./wx')

module.exports = ({openid, amount}) => {
  const wxappid = wx.APP_ID //公众号appid
  const key = wx.KEY //微信商户支付密钥

  const re_openid = 'ogwQq1dwtjtWLANgde3MLKDsXZ8I' //付款目标的openid
  const mch_id = wx.MCH_ID //商户号
  const mch_billno ='REDBAG' + Math.floor(Math.random() * 10000) //订单号

  const client_ip = '115.236.37.50'

  const send_name = '非凡教育' //商户名字
  const total_amount = 1 //付款金额
  const total_num = 1 //红包发放总人数
  const act_name = '非凡向你发红包' //活动名称
  const wishing = '向奋斗者致敬!' //红包祝福语
  const remark = '漫天红包快来拿!' //备注信息


  const nonce_str = `FFJY${Math.floor(Math.random() * 10000)}` //随机字符串

  //拼接码
  const query = `
    act_name=${act_name}
    &client_ip=${client_ip}
    &mch_billno=${mch_billno}
    &mch_id=${mch_id}
    nonce_str=${nonce_str}
    &re_openid=${re_openid}
    &remark=${remark}
    &send_name=${send_name}
    &total_amount=${total_amount}
    &total_num=${total_num}
    &wishing=${wishing}
    &wxappid=${wxappid}
    &key=${key}
  `

  const md5 = require('blueimp-md5')
  const sign = md5(query).toUpperCase()

  return `
    <xml>
      <act_name><![CDATA[${act_name}]]></act_name>
      <client_ip><![CDATA[${client_ip}]]></client_ip>
      <mch_billno><![CDATA[${mch_billno}]]></mch_billno>
      <mch_id><![CDATA[${mch_id}]]></mch_id>
      <nonce_str><![CDATA[${nonce_str}]]></nonce_str>
      <re_openid><![CDATA[${re_openid}]]></re_openid>
      <remark><![CDATA[${remark}]]></remark>
      <send_name><![CDATA[${send_name}]]></send_name>
      <total_amount><![CDATA[${total_amount}]]></total_amount>
      <total_num><![CDATA[${total_num}]]></total_num>
      <wishing><![CDATA[${wishing}]]></wishing>
      <wxappid><![CDATA[${wxappid}]]></wxappid>
      <sign><![CDATA[${sign}]]></sign>
    </xml>
  `
}