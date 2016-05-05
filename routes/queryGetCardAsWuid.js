var handler = module.exports;

var async = require('async');
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "查询球员卡牌获取消耗信息";
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
                queryGetCardData(_stash, function(error, doc) {
                    return callback(null);
                });
            } else if (_stash.ope == '2') {
                //暂时球员卡没有消耗
                return callback(null);
            } else {
                return callback(null);
            }
            
        }
    }, function(error, doc) {
        console.log('==========>>>0102:\t', _stash);
        res.render('queryGetCardAsWuid', {stash: _stash});
    });
};

var queryGetCardData = function(stash, cb) {
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86000;
    var _sql = {f0: 105, f1: {$gte: utilityFunc.getTimestamp(stash.startDate), $lt: endTime}, f2: stash.wuid};
    
    mongoDB.getNBA2OpeDB(stash.platform, stash.server, function(error, db, coll) {
        if (error) return cb(error);
        
        coll.find(_sql).toArray(function(error, doc) {
            doc.forEach(function(elem) {
                console.log('==========>>>0103:\t', elem.f5);
                for (var i in elem.f5) {
                    if (elem.f5[i].i >= 10000 && elem.f5[i].i < 20000)  {
                        stash.data.push({
                            wuid: elem.f2, 
                            time: utilityFunc.getDetailTime(elem.f1), 
                            action: utilityFunc.getActionName(elem.f3), 
                            reward: utilityFunc.formateItemData(stash.platform, elem.f5[i].i, elem.f4)
                        });
                    }
                }
            });
            db.close();
            return cb(null);
        });
    });
};
