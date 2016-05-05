var async = require('async');
var mongoLong = require('mongodb').Long;
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');
var handler = module.exports;

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "统计登陆信息";
    _stash.area = utilityFunc.area;
    _stash.data = [];
    
    _stash.servers = utilityFunc.getAllServers();
    
    async.series({
        checkParam: function(callback) {
            checkArguments(_stash, callback);
        },
        queryBase: function(callback) {
            if (!_stash.btn || _stash.btn != 'query') return callback(null);
            
            query(_stash, function(error, doc) {
                return callback(error);
            });
        },
        downloadBase: function(callback) {
            if (!_stash.btn || _stash.btn != 'download') return callback(null);
            download(_stash, function(error, doc) {
                if(!error) utilityFunc.downloadCSV(res, _stash.data, 'statisticLogin.csv'); 
                return callback(error);
            });
        },
    }, function(error, doc) {
        if(error) _stash.error = utilityFunc.getErrMsg(error); 
        console.log('over===>>:\t', error, _stash.data.length);
        if (!_stash.btn || _stash.btn != 'download') {
            res.render('statisticLogin', {stash: _stash});
        }
    });
};

var checkArguments = function(stash, callback) {
    console.log('======>>0101:\t', stash);
    return callback(null);
};

var query = function(stash, cb) {
    var startTime = utilityFunc.getTimestamp(stash.startDate);
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86000;
    var server = parseInt(stash.server);
    var date = stash.startDate.replace(/-/g, '') + '-' + stash.endDate.replace(/-/g, '');
    
    var sql = {f0: 110, f1: {$gte: startTime, $lt: endTime}, f3: 244};
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
                if (error) {
                    ++ start;
                    return callback1(error);
                }
                
                coll.find(sql).toArray(function(error, docs) {
                    if(error) return callback1(error);
                    for (var i in docs) {
                        stash.data.push({
                            wuid:       docs[i].f2, 
                            server:     servers[start].i, 
                            time:       utilityFunc.getDetailTime(docs[i].f1),
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
    stash.data.push(['wuid','区服','登陆时间','查询日期']);
    query(stash, function(error, doc) {
        return callback(error, stash);
    });
};
