var http = require('http');
var url = require('url');
var Iconv = require('iconv').Iconv;
var server = http.createServer(function(req, res){
    var path = url.parse(req.url).pathname;

    if(path == '/favicon.ico'){
        res.end('');
    }else{
        var filename = '数据报表.csv';
        var util = require('../models/UtilityFunction');
        var data = [['区服','wuid','名称','排名','得分']];
        data.push({server: 1, wuid: 356977654286816, name: '浮夸', rank: 3, score: 1800});
        data.push({server: 3, wuid: 124375110290868, name: '艾泽拉斯国王', rank: 2, score: 1982});
        data.push({server: 2, wuid: 19947275421702, name: '智利沼泽龙', rank: 1, score: 2015});
        console.log('raw: ', data);
        var content = util.objToCSVString(data);
        console.log('trans step 1: ', content);
        //excel2007默认不支持utf-8编码的csv文件
        var iconv = new Iconv('UTF-8', 'GBK//IGNORE');
        content = iconv.convert(content);
        res.setHeader('Content-Type', 'text/csv; charset=GBK');
        filename = iconv.convert(filename).toString('binary');
        res.setHeader('Content-Disposition', 'attachment;filename="'+ filename +'"');
        res.end(content);
    }
}).listen(22222);
