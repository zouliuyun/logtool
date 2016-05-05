var handler = module.exports;

var fs = require('fs');
var async = require('async');
var utilityFunc = require('../models/UtilityFunction');
var daily = require('./dailyDayStatistic');

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "查询玩家钻石产出与消耗";
    _stash.area = utilityFunc.area;
    _stash.servers = utilityFunc.getAllServers();
    
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
            if (_stash.ope == '1') {
                queryAdd(_stash, function(error, doc) {
                    return callback(error);
                });
            } else if ( _stash.ope == '2') {
                queryDel(_stash, function(error, doc) {
                    return callback(error);
                });
            } else {
                return callback(null);
            }
        },
        downloadBase: function(callback) {
            if (!_stash.btn || _stash.btn != 'download') return callback(null);
            _stash.data.splice(0,0,['区服','查询日期','Wuid','总额']);
            utilityFunc.downloadCSV(res, _stash.data, 'dayPersonMoney.csv');
            return callback(null);
        }
    }, function(error, doc) {
        if(error) _stash.error = utilityFunc.getErrMsg(error); 
        //console.log('==========>>>0102:\t', _stash);
        if (!_stash.btn || _stash.btn != 'download') {
            res.render('queryDayPersonMoney', {stash: _stash});
        }
    });
};

var queryAdd = function(stash, cb) {
    var server = parseInt(stash.server);
    var path = (stash.platform != 1) ? daily.traditionalFilePath : daily.simplifiedfilePath;
    var fileName = daily.getFileName(stash.startDate, daily.dayDetailMoneyAddFileName, path);
    fs.readFile(fileName, 'utf8', function(error, data) {
        if (error === null) {
            var dataArray = data.split('\n');
            for (var i = 0; i < dataArray.length - 1; i++) {
                data = dataArray[i].split(',');
                if (data[0] == server) {
                    stash.data.push({
                        server: data[0],
                        date: data[1],
                        wuid: data[2],
                        count: data[3]
                    });
                }
            }
            return cb(null);
        } else if (error.code == 'ENOENT') {
            daily.genDetailDayMoneyAdd(stash.platform, stash.startDate, fileName, function(err, datas) {
                console.log('=========>>>0110:\t', err);
                if (err === null) stash.data = datas;
                return cb(null);
            }, server);
        } else {
            return cb(null);
        }
    });
};

var queryDel = function(stash, cb) {
    var server = parseInt(stash.server);
    var path = (stash.platform != 1) ? daily.traditionalFilePath : daily.simplifiedfilePath;
    var fileName = daily.getFileName(stash.startDate, daily.dayDetailMoneyDelFileName, path);
    fs.readFile(fileName, 'utf8', function(error, data) {
        console.log('=========>>>0105:\t', error, data);
        if (error === null) {
            var dataArray = data.split('\n');
            for (var i = 0; i < dataArray.length - 1; i++) {
                data = dataArray[i].split(',');
                if (data[0] == server) {
                    stash.data.push({
                        server: data[0],
                        date: data[1],
                        wuid: data[2],
                        count: data[3]
                    });
                }
            }
            return cb(null);
        } else if (error.code == 'ENOENT') {
            daily.genDetailDayMoneyDel(stash.platform, stash.startDate, fileName, function(err, datas) {
                console.log('=========>>>0110:\t', err);
                if (err === null) stash.data = datas;
                return cb(null);
            }, server);
        } else {
            return cb(null);
        }
    });
};

