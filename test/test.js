main();

function testMail(callback) {
    var mail = require('./models/mail');
    var data = ['Hello', 'World', '!'];
    var options = {
        to: 'zhilei.tian@dena.com',
        subject: 'logTool Test',
        text: '详情见附件',
        attachments: [
        {filename: 'test.txt', content: data.toString()}
        ]
    };
    mail.sendMail(options, callback);
}

function testUtil() {
    var util = require('../models/UtilityFunction');
    var data = [];
    data.push(['区服','mid','wuid','名称','VIP','卡牌ID','卡牌星级','卡牌品阶','卡牌等级']);
    data.push({s:7, m:60662676, w:277486399516400, n:'开拓者', v:9, ci:10092, cs:5, cq:4, cl:'40'});
    data.push({s:7, m:60662676, w:277486399516400, n:'开拓者', v:9, ci:10064, cs:3, cq:4, cl:'40'});
    var str = util.objToCSVString(data);
    console.log(str);
}

function main() {
    //testMail(function(){});
    testUtil();
}
