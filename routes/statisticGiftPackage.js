var handler = module.exports;

var async = require('async');
var mongoLong = require('mongodb').Long;
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "活动商城礼包购买统计";
    _stash.area = utilityFunc.area;
    
    console.log('=========>>>0101:\t', _stash);

    _stash.servers = utilityFunc.getAllServers();
    
    async.series({
        checkParam: function(callback) {    
            _stash.data = [];
            return callback(null);    
        },
        queryBase: function(callback) {
            if (!_stash.btn) {
                return callback(null);
            }

            if(_stash.btn == 'download') {
                _stash.data.push(['区服','wuid','礼包ID','礼包名称','礼包数量','查询日期','VIP']);
            }

            query(_stash, function(error, doc) {
                return callback(error);
            });
        },
        downloadBase: function(callback) {
            if (!_stash.btn || _stash.btn != 'download') return callback(null);
            utilityFunc.downloadCSV(res, _stash.data, 'statisticGiftPackage.csv'); 
            return callback(null);
        },
    }, function(error, doc) {
        if(error) _stash.error = utilityFunc.getErrMsg(error); 
        if (!_stash.btn || _stash.btn != 'download') {
            res.render('statisticGiftPackage', {stash: _stash});
        }
    });
};

var query = function(stash, cb) {
    var startTime = utilityFunc.getTimestamp(stash.startDate);
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86000;
    stash.startDate = stash.startDate.replace(/-/g, '');
    stash.endDate = stash.endDate.replace(/-/g, '');
    var date = stash.startDate + '-' + stash.endDate;
    var server = parseInt(stash.server);
    var sql = {f0: 121, f1: {$gte: startTime, $lt: endTime}, f3: 132}; //活动商城购买
    if (stash.subID && stash.subID !== '') {
        sql.f5 = parseInt(stash.subID);
    }    
    var servers = [];
    if (server > 0) servers = [{i: server}];
    else if (stash.platform == 1) servers = utilityFunc.getCNConfig();
    else servers = utilityFunc.getTWConfig();

    if (stash.platform == 1) {
        if(stash.server == -2) {
            servers = servers.filter(function(element, index, array) {
                return (element.i > 10000 || element.i % 2 == 1);
            });
        }
        else if(stash.server == -3) {
            servers = servers.filter(function(element, index, array) {
                return (element.i > 10000 || element.i % 2 === 0);
            });
        }
    }
    var id = {wuid: '$f2', id: '$f5'};
    console.log('=========>>>0103:\t', sql, servers);
    async.series({
        statistic: function(callback) {
            var start = 0;
            async.whilst(
                function(){ return start < servers.length; },
                function(callback1){
                    mongoDB.getNBA2OpeDB(stash.platform, servers[start].i, function(error, db, coll) {
                        if (error) {
                            ++ start;
                            return callback1(error);
                        }
                        coll.aggregate([{$match: sql}, {$group: {_id: id, total: {$sum: '$f4'}}}], function(error, values){
                            //console.log('test2==>', error, values);
                            if(error) {
                                db.close();
                                return callback1(error);
                            }
                            for (var i = 0; i < values.length; ++i) {
                                stash.data.push({
                                    server  : servers[start].i,
                                    wuid    : values[i]._id.wuid,
                                    id      : values[i]._id.id,
                                    name    : utilityFunc.getGiftPackName(stash.platform, values[i]._id.id),
                                    count   : values[i].total,
                                    date    : date
                                });
                            }
                            db.close();
                            ++ start;
                            return callback1(null);
                        });
                    });
                },
                function(error){
                    return callback(error);
                }
            );
        },
        getVIP: function(callback) {
            mongoDB.getGameDBBackUp(stash.platform, stash.version, 'game_user', stash.endDate, function(error, db, coll) {
                console.log('test1====> ', error, stash.data.length);
                if (error) return callback(error);
                var start = (stash.btn == 'download') ? 1 : 0;
                async.whilst(
                    function(){ return start < stash.data.length; },
                    function(callback1){
                        coll.findOne({_id: mongoLong.fromString(stash.data[start].wuid)}, {fields:{vip:1}}, function(error, doc) {
                            if (!error && doc && doc.vip) {
                                stash.data[start].vip = doc.vip[0];
                            }
                            ++ start;
                            return callback1(error);
                        });
                    },
                    function(error){
                        db.close();
                        return callback(error);
                    }
                );
            });
        }
    },function(error) {
        return cb(error);
    });
};
