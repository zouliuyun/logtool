var async = require('async');
var mongoLong = require('mongodb').Long;
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');
var handler = module.exports;

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "游戏ID查询充值信息";
    _stash.area = utilityFunc.area;
    _stash.data = [];
    
    async.series({
        checkParam: function(callback) {
            checkArguments(_stash, callback);
        },
        queryRecharge: function(callback) {
            if (!_stash.btn || _stash.btn != 'query') return callback(null);
            
            rechargeQuery(req.app, _stash, function(error, doc) {
                return callback(null);
            });
        },
        downloadBase: function(callback) {
            if (!_stash.btn || _stash.btn != 'download') return callback(null);
            download(req.app, _stash, function(error, doc) {
                utilityFunc.downloadCSV(res, _stash.data, 'wuidToRecharge.csv'); 
                return callback(null);
            });
        },
    }, function(error, doc) {
        if (!_stash.btn || _stash.btn != 'download') {
            res.render('backupQueryWuidToRecharge', {stash: _stash});
        }
    });
};

var checkArguments = function(stash, callback) {
    console.log('======>>0101:\t', stash);
    return callback(null);
};

var rechargeQuery = function(app, stash, cb) {
    stash.wuids = stash.wuids.replace(/ /g, '');
    stash.wuids = stash.wuids.split('\r\n');
    if (!Array.isArray(stash.wuids)) return cb(null);
    var startTime = utilityFunc.getTimestamp(stash.startDate);
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86000;
    stash.endDate = stash.endDate.replace(/-/g, '');
    
    mongoDB.getGameDBBackUp(stash.platform, stash.version, 'recharge_history', stash.endDate, function(error, db, coll) {
        if (error) return cb(error);
        var start = 0;
        async.whilst(
            function() {return start < stash.wuids.length;},
            function(callback) {
                if(stash.wuids[start] <= 0) {
                    console.log('==>invalid wuid: ', stash.wuids[start]);
                    ++start;
                    return callback(null);
                }
                var _sql = {wuid: mongoLong.fromString(stash.wuids[start]), createTime: {$gte: startTime, $lt: endTime}};
                console.log('======>>0103:\t', start, stash.wuids[start], _sql);
                coll.find(_sql).toArray(function(error, doc) {
                    if (doc && doc.length > 0) {
                        for (var i in doc) {
                            if (doc[i].item) {
                                stash.data.push({wuid: stash.wuids[start], server: doc[i].worldId, recharge: doc[i].item[0], diamond: doc[i].coinNumber, ct: utilityFunc.getDetailTime(doc[i].createTime)});
                            }
                        }
                    } else {
                        stash.data.push({wuid: stash.wuids[start], server: -1, recharge: 0, diamond: 0, ct: 0});
                    }
                    ++start;
                    callback(null);
                });
            },
            function(error) {
                console.log('======>>0104:\t', stash.data);
                db.close();
                return cb(error);
            }
        );
    });
};

var download = function(app, stash, callback) {
    stash.data.push(['wuid','区服','充值','钻石','时间']);
    rechargeQuery(app, stash, function(error, doc) {
        return callback(null, stash);
    });
};
