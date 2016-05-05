var handler = module.exports;

var fs = require('fs');
var async = require('async');
var utilityFunc = require('../models/UtilityFunction');
var daily = require('./dailyDayStatistic');

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "查询每日金币产出与消耗";
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
            _stash.data.splice(0,0,['区服','日期','操作','人数','总额']);
            utilityFunc.downloadCSV(res, _stash.data, 'dayCoin.csv');
            return callback(null);
        }
    }, function(error, doc) {
        if(error) _stash.error = utilityFunc.getErrMsg(error); 
        console.log('==========>>>0102:\t', _stash);
        if (!_stash.btn || _stash.btn != 'download') {
            res.render('queryDayCoinDetail', {stash: _stash});
        }
    });
};

var queryAdd = function(stash, cb) {
    var path = daily.simplifiedfilePath;
    if(stash.platform != 1) path = daily.traditionalFilePath;
    var fileName = daily.getFileName(stash.startDate, daily.dayCoinAddFileName, path);
    fs.readFile(fileName, 'utf8', function(error, data) {
        console.log('=========>>>0105:\t', error, fileName, data);
        if (error === null) {
            var dataArray = data.split('\n');
            for (var i = 0; i < dataArray.length - 1; i++) {
                data = dataArray[i].split(',');
                stash.data.push({
                    server: data[0],
                    date: data[1],
                    action: utilityFunc.getActionName(data[2]),
                    count: data[3],
                    total: data[4]
                });
            }
            return cb(null);
        } else if (error.code == 'ENOENT') {
            daily.genDayCoinAdd(stash.platform, stash.startDate, fileName, function(err, datas) {
                console.log('=========>>>0110:\t', err);
                if (err === null) stash.data = datas;
                return cb(null);
            });
        } else {
            return cb(null);
        }
    });
};

var queryDel = function(stash, cb) {
    var path = daily.simplifiedfilePath;
    if(stash.platform != 1) path = daily.traditionalFilePath;
    var fileName = daily.getFileName(stash.startDate, daily.dayCoinDelFileName, path);
    fs.readFile(fileName, 'utf8', function(error, data) {
        console.log('=========>>>0105:\t', error, fileName, data);
        if (error === null) {
            var dataArray = data.split('\n');
            for (var i = 0; i < dataArray.length - 1; i++) {
                data = dataArray[i].split(',');
                stash.data.push({
                    server: data[0],
                    date: data[1],
                    action: utilityFunc.getActionName(data[2]),
                    count: data[3],
                    total: data[4]
                });
            }
            return cb(null);
        } else if (error.code == 'ENOENT') {
            daily.genDayCoinDel(stash.platform, stash.startDate, fileName, function(err, datas) {
                console.log('=========>>>0110:\t', err);
                if (err === null) stash.data = datas;
                return cb(null);
            });
        } else {
            return cb(null);
        }
    });
};

