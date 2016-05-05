var handler = module.exports;

var fs = require('fs');
var async = require('async');
var utilityFunc = require('../models/UtilityFunction');
var daily = require('./dailyDayStatistic');

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "查询每日冠军之路各关卡进入次数";
    _stash.area = utilityFunc.area; 
    
    console.log('=========>>>0101:\t', _stash);

    async.series({
        checkParam: function(callback) {    
            _stash.data = [];
            if(_stash.startDate && (_stash.startDate.replace(/-/g, '') >= utilityFunc.getDateTime())) {
                return callback('invalid');
            }
            return callback(null);    
        },
        queryBase: function(callback) {
            if (_stash.platform == '1' || _stash.platform == '2') {
                query(_stash, function(error, doc) {
                    return callback(error);
                });
            } else {
                return callback(null);
            }
        },
        downloadBase: function(callback) {
            if (!_stash.btn || _stash.btn != 'download') return callback(null);
            _stash.data.splic(0,0,['区服','日期','关卡ID','关卡类别','关卡名称','进入次数']);
            utilityFunc.downloadCSV(res, _stash.data, 'legendEnter.csv', 'GBK');
            return callback(null);
        }
    }, function(error, doc) {
        if(error) _stash.error = utilityFunc.getErrMsg(error);
        if (!_stash.btn || _stash.btn != 'download') {
            res.render('queryDayLegendEnter', {stash: _stash});
        }
    });
};

var query = function(stash, cb) {
    var config = utilityFunc.getLegendConfig(stash.platform);
    var path = daily.simplifiedfilePath;
    if(stash.platform != 1) path = daily.traditionalFilePath;
    var fileName = daily.getFileName(stash.startDate, daily.dayLegendEnterFileName, path);
    fs.readFile(fileName, 'utf8', function(error, data) {
        if (error === null) {
            var dataArray = data.split('\n');
            for (var i = 0; i < dataArray.length - 1; i++) {
                data = dataArray[i].split(',');
                var chapter = config[data[2]] ? config[data[2]] : {};
                stash.data.push({
                    server      : data[0],
                    date        : data[1],
                    chapterID   : data[2],
                    type        : chapter.t,
                    chapterName : chapter.n,
                    count       : data[3],
                });
            }
            return cb(null);
        } else if (error.code == 'ENOENT') {
            daily.genDayLegendEnter(stash.platform, stash.startDate, fileName, function(err, datas) {
                if (err === null) stash.data = datas;
                console.log('=========>>>0110:\t', err, datas.length, stash.data.length);
                return cb(null);
            });
        } else {
            return cb(null);
        }
    });
};

