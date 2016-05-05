var async = require('async');
var mongoLong = require('mongodb').Long;
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');
var handler = module.exports;

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "统计充值信息";
    _stash.area = utilityFunc.area;
    _stash.data = [];
    
    _stash.servers = utilityFunc.getAllServers();
    
    async.series({
        checkParam: function(callback) {
            checkArguments(_stash, callback);
        },
        queryRecharge: function(callback) {
            if (!_stash.btn || _stash.btn != 'query') return callback(null);
            
            rechargeQuery(_stash, function(error, doc) {
                return callback(error);
            });
        },
        downloadBase: function(callback) {
            if (!_stash.btn || _stash.btn != 'download') return callback(null);
            download(_stash, function(error, doc) {
                if(!error) utilityFunc.downloadCSV(res, _stash.data, 'statisticRecharge.csv'); 
                return callback(error);
            });
        },
    }, function(error, doc) {
        if(error) _stash.error = utilityFunc.getErrMsg(error); 
    //    console.log('over===>>:\t', error, _stash);
        if (!_stash.btn || _stash.btn != 'download') {
            res.render('statisticRecharge', {stash: _stash});
        }
    });
};

var checkArguments = function(stash, callback) {
    console.log('======>>0101:\t', stash);
    return callback(null);
};

/*
//后期改为log查询！OPE_RECHARGE/RECHARGE_MOBAGE_PAY_ITEM
var rechargeQuery = function(stash, cb) {
    var startTime = utilityFunc.getTimestamp(stash.startDate);
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86000;
    var server = parseInt(stash.server);
    
    var _sql = {createTime: {$gte: startTime, $lte: endTime}};
    if (server > 0) _sql.worldId = server;
    console.log('======>>0103:\t', _sql);
    mongoDB.getNBA2BackUpDB(stash.platform, 'recharge_history', stash.endDate, function(error, db, coll) {
        if (error) return cb(error);
        coll.find(_sql).toArray(function(error, doc) {
            if (doc && doc.length > 0) {
                for (var i in doc) {
                    if (doc[i].item) {
                        stash.data.push({wuid: doc[i].wuid, server: doc[i].worldId, recharge: doc[i].item[0], diamond: doc[i].coinNumber, ct: utilityFunc.getDetailTime(doc[i].createTime)});
                    }
                }
            } 
            db.close();
            return cb(error);
        })
    })
} */

var rechargeQuery = function(stash, cb) {
    var startTime = utilityFunc.getTimestamp(stash.startDate);
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86000;
    var date = stash.startDate.replace(/-/g, '') + '-' + stash.endDate.replace(/-/g, '');
    var server = parseInt(stash.server);
    
    var sql = {f0: 124, f1: {$gte: startTime, $lt: endTime}, f3: 281};
    var servers = [];
    if (server > 0) servers = [{i: server}];
    else if (stash.platform == 1) servers = utilityFunc.getCNConfig();
    else servers = utilityFunc.getTWConfig();
    console.log('======>>0103:\t', sql, servers);
    var start = 0;
    async.whilst(
        function(){ return start < servers.length; },
        function(callback1){
            mongoDB.getNBA2OpeDB(stash.platform, servers[start].i, function(error, db, coll) {
                if (error) return callback1(error);
                
                coll.find(sql).toArray(function(error, docs) {
                    if(error) return callback1(error);
                    for (var i in docs) {
                        stash.data.push({
                            wuid:       docs[i].f5.wuid, 
                            mid:        docs[i].f4.mid, 
                            name:       docs[i].f4.n, 
                            level:      docs[i].f4.level,
                            server:     docs[i].f5.worldId, 
                            recharge:   docs[i].f5.money, 
                            diamond:    docs[i].f5.coinNumber, 
                            ct:         utilityFunc.getDetailTime(docs[i].f1),
                            date:       date
                        });
                    }
                    db.close();
                    ++ start;
                    return callback1(null);
                });
            });
        },
        function(error){
            return cb(error);
        }
    );
};

var download = function(stash, callback) {
    stash.data.push(['wuid','mid','名称','等级','区服','充值','钻石获得','充值时间','查询时间']);
    rechargeQuery(stash, function(error, doc) {
        return callback(error, stash);
    });
};
