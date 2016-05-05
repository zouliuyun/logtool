var handler = module.exports;

var async = require('async');
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "查询球员养成信息";
    _stash.area = utilityFunc.area;
    
    console.log('=========>>>0101:\t', _stash);

    _stash.servers = utilityFunc.getAllServers();
    
    async.series({
        checkParam: function(callback) {    
            _stash.data = [];
            return callback(null);    
        },
        queryBase: function(callback) {
            if (_stash.ope == '1') {
                queryStarUp(_stash, function(error, doc) {
                    return callback(error);
                });
            } else if (_stash.ope == '2') {
                queryLevelUp(_stash, function(error, doc) {
                    return callback(error);
                });
            } else if (_stash.ope == '3') {
                queryQualityUp(_stash, function(error, doc) {
                    return callback(error);
                });
            } else {
                return callback(null);
            }
        }
    }, function(error) {
        console.log('==========>>>0102:\t', error, _stash);
        if(error) _stash.error = utilityFunc.getErrMsg(error); 
        res.render('queryCardTrainAsWuid', {stash: _stash});
    });
};

var queryStarUp = function(stash, cb) {
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86000;
    var _sql = {f0: 107, f1: {$gte: utilityFunc.getTimestamp(stash.startDate), $lt: endTime}, f2: stash.wuid, f3: 108}; 
    console.log('=========>>>0103:\t', _sql);
    mongoDB.getNBA2OpeDB(stash.platform, stash.server, function(error, db, coll) {
        if (error) return cb(error);
        coll.find(_sql).toArray(function(error, doc) {
            doc.forEach(function(elem) {
                console.log('=========>>>0104:\t', elem);
                stash.data.push({
                    time : utilityFunc.getDetailTime(elem.f1), 
                    name : utilityFunc.getCardName(stash.platform, elem.f4.i),
                    star : elem.f4.s
                });
            });
            db.close();
            return cb(error);
        });
    });
};

var queryLevelUp = function(stash, cb) {
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86000;
    var _sql = {f0: 108, f1: {$gte: utilityFunc.getTimestamp(stash.startDate), $lt: endTime}, f2: stash.wuid, f3: 151}; 
    console.log('=========>>>0103:\t', _sql);
    mongoDB.getNBA2OpeDB(stash.platform, stash.server, function(error, db, coll) {
        if (error) return cb(error);
        coll.find(_sql).toArray(function(error, doc) {
            doc.forEach(function(elem) {
                console.log('=========>>>0104:\t', elem);
                stash.data.push({
                    time : utilityFunc.getDetailTime(elem.f1), 
                    name : utilityFunc.getCardName(stash.platform, elem.f4.i),
                    inc  : elem.f4.inc,
                    cur  : elem.f4.cur
                });
            });
            db.close();
            return cb(error);
        });
    });
};

var queryQualityUp = function(stash, cb) {
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86000;
    var _sql = {f0: 107, f1: {$gte: utilityFunc.getTimestamp(stash.startDate), $lt: endTime}, f2: stash.wuid, f3: 101}; 
    console.log('=========>>>0103:\t', _sql);
    mongoDB.getNBA2OpeDB(stash.platform, stash.server, function(error, db, coll) {
        if (error) return cb(error);
        coll.find(_sql).toArray(function(error, doc) {
            doc.forEach(function(elem) {
                console.log('=========>>>0104:\t', elem);
                stash.data.push({
                    time : utilityFunc.getDetailTime(elem.f1), 
                    name : utilityFunc.getCardName(stash.platform, elem.f4.i),
                    q    : elem.f4.q
                });
            });
            db.close();
            return cb(error);
        });
    });
};
