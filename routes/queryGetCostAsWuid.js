var handler = module.exports;

var async = require('async');
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "查询球员获取消耗信息";
    _stash.area = utilityFunc.area;
    
    _stash.servers = utilityFunc.getAllServers();
    
    console.log('=========>>>0101:\t', _stash);
    
    async.series({
        checkParam: function(callback) {    
            _stash.data = [];
            return callback(null);    
        },
        queryWuidToLog: function(callback) {
            if (_stash.ope == '1') {
                queryRewardData(_stash, function(error, doc) {
                    return callback(null);
                });
            } else if (_stash.ope == '2') {
                queryCostData(_stash, function(error, doc) {
                    return callback(null);
                });
            } else {
                return callback(null);
            }
            
        }
    }, function(error, doc) {
        console.log('==========>>>0102:\t', _stash);
        res.render('queryGetCostAsWuid', {stash: _stash});
    });
};

var queryRewardData = function(stash, cb) {
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86000;
    var _sql = {f0: {$in: [103, 105, 106]}, f1: {$gte: utilityFunc.getTimestamp(stash.startDate), $lt: endTime}, f2: stash.wuid};
    if (stash.subID && stash.subID !== '') {
        _sql.f3 = parseInt(stash.subID);
    }    
    
    async.series({
        query: function(callback) {
            mongoDB.getNBA2OpeDB(stash.platform, stash.server, function(error, db, coll) {
                if (error) return callback(error);
                
                coll.find(_sql).toArray(function(error, doc) {
                    doc.forEach(function(elem) {
                        stash.data.push({
                            wuid: elem.f2, 
                            type: elem.f3, 
                            time: utilityFunc.getDetailTime(elem.f1), 
                            action: utilityFunc.getActionName(elem.f3), 
                            reward: utilityFunc.formateItemsData(stash.platform, elem.f5)
                        });
                    });
                    db.close();
                    return callback(null);
                });
            });
        }
    }, function(error, doc) {
        return cb(null);
    });
    
};

var queryCostData = function(stash, cb) {
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86000;
    var _sql = {f0: 101, f1: {$gte: utilityFunc.getTimestamp(stash.startDate), $lt: endTime}, f2: stash.wuid};
    if (stash.subID && stash.subID !== '') {
        _sql.f3 = parseInt(stash.subID);
    }    
    
    async.series({
        query: function(callback) {
            mongoDB.getNBA2OpeDB(stash.platform, stash.server, function(error, db, coll) {
                if (error) return callback(error);
                
                coll.find(_sql).toArray(function(error, doc) {
                    doc.forEach(function(elem) {
                        stash.data.push({
                            wuid: elem.f2, 
                            type: elem.f3, 
                            time: utilityFunc.getDetailTime(elem.f1), 
                            action: utilityFunc.getActionName(elem.f3), 
                            cost : utilityFunc.formateItemsData(stash.platform, elem.f4)
                        });
                    });
                    db.close();
                    return callback(null);
                });
            });
        }
    }, function(error, doc) {
        return cb(null);
    });
};
