var handler = module.exports;

var fs = require('fs');
var async = require('async');
var utilityFunc = require('../models/UtilityFunction');
var daily = require('./dailyDayStatistic');

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "查询每日各比赛参赛情况";
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
            if (_stash.ope == '1' || _stash.ope == '2' || _stash.ope == '3') {
                query(_stash, function(error, doc) {
                    return callback(error);
                });
            } else {
                return callback(null);
            }
        },
        downloadBase: function(callback) {
            if (!_stash.btn || _stash.btn != 'download') return callback(null);
            _stash.data.splice(0,0,['区服','日期','参与人数','参与次数']);
            utilityFunc.downloadCSV(res, _stash.data, 'dayMatch.csv');
            return callback(null);
        }
    }, function(error, doc) {
        console.log('==========>>>0102:\t', _stash);
        if(error) _stash.error = utilityFunc.getErrMsg(error);
        if (!_stash.btn || _stash.btn != 'download') {
            res.render('queryDayMatchDetail', {stash: _stash});
        }
    });
};

var query = function(stash, cb) {
    var path = daily.simplifiedfilePath;
    if(stash.platform != 1) path = daily.traditionalFilePath;
    var fileName = daily.getFileName(stash.startDate, daily.dayMatchFileName, path);
    fs.readFile(fileName, 'utf8', function(error, data) {
        if (error === null) {
            var dataArray = data.split('\n');
            for (var i = 0; i < dataArray.length - 1; i++) {
                data = dataArray[i].split(',');
                if(stash.ope == data[0]){
                    stash.data.push({
                        server: data[1],
                        date: data[2],
                        playerCount: data[3],
                        matchCount: data[4],
                    });
                }
            }
            return cb(null);
        } else if (error.code == 'ENOENT') {
            daily.genDayMatch(stash.platform, stash.startDate, fileName, function(err, datas) {
                console.log('=========>>>0110:\t', err);
                if (err === null && datas[stash.ope-1]) stash.data = datas[stash.ope-1];
                return cb(null);
            });
        } else {
            return cb(null);
        }
    });
};

