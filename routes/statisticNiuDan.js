var handler = module.exports;

var async = require('async');
var mongoLong = require('mongodb').Long;
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "选秀统计";
    _stash.area = utilityFunc.area;

    console.log('=========>>>0101:\t', _stash);

    _stash.servers = utilityFunc.getAllServers();

    async.series({
        checkParam: function(callback) {    
            _stash.data = [];
            return callback(null);    
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
                if(!error) utilityFunc.downloadCSV(res, _stash.data, 'statisticNiuDan.csv'); 
                return callback(error);
            });
        },
    }, function(error, doc) {
        if(error) _stash.error = utilityFunc.getErrMsg(error); 
        if (!_stash.btn || _stash.btn != 'download') {
            res.render('statisticNiuDan', {stash: _stash});
        }
        //console.log('over====>', error, _stash);
    });
};

var query = function(stash, cb) {
    var startTime = utilityFunc.getTimestamp(stash.startDate);
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86000;
    stash.startDate = stash.startDate.replace(/-/g, '');
    stash.endDate = stash.endDate.replace(/-/g, '');
    var date = stash.startDate + '-' + stash.endDate;
    var server = parseInt(stash.server);
    var subID = parseInt(stash.subID);
    var sql;
    if (isNaN(subID)) {
        sql = {f0: 126, f1: {$gte: startTime, $lt: endTime}, f3: 232};
    } else {
        sql = {f0: 126, f1: {$gte: startTime, $lt: endTime}, f3: 232, 'f4.i': subID};
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
    var id = {wuid: '$f2', id: '$f4.i', lc: '$f4.lc'};
    console.log('=========>>>0103:\t', sql);

    async.series({
        statistic: function(callback) {
            var start = 0;
            async.whilst(
                function(){ return start < servers.length; },
                function(callback1){
                    mongoDB.getNBA2OpeDB(stash.platform, servers[start].i, function(error, db, coll) {
                        if (error) return callback1(error);
                        var datas = {};
                        coll.aggregate([{$match: sql}, {$group: {_id: id, total: {$sum: 1}, costs: {$push: '$f4.cost'}}}], function(error, values){
                            if(error) {
                                db.close();
                                return callback1(error);
                            }
                            var wuid = 0, id = 0;
                            for (var i = 0; i < values.length; ++i) {
                                wuid = values[i]._id.wuid;
                                id = values[i]._id.id;
                                var money = 0;
                                values[i].costs.forEach(function(costs) {
                                    costs.forEach(function(cost) {
                                        if(id == 1001 && cost.i == 20002) money += cost.a; //统计金币
                                        else if(id > 2000 && cost.i == 20003) money += cost.a; //统计钻石消耗
                                    });
                                });
                                var tenFlag = (values[i]._id.lc == 10);
                                if(datas[wuid]) {
                                    if(datas[wuid][id]) {
                                        if(tenFlag) {
                                            datas[wuid][id].ten = values[i].total;
                                            datas[wuid][id].tenMoney = money;
                                        } else {
                                            datas[wuid][id].one = values[i].total;
                                            datas[wuid][id].oneMoney = money;
                                        }
                                    } else if(tenFlag) {
                                        datas[wuid][id] = {one: 0, oneMoney: 0 ,ten: values[i].total, tenMoney: money}; 
                                    } else {
                                        datas[wuid][id] = {one: values[i].total, oneMoney: money, ten: 0, tenMoney: 0}; 
                                    }
                                } else {
                                    var data = {};
                                    if(tenFlag) {
                                        data[id] = {one: 0, oneMoney:0, ten: values[i].total, tenMoney: money};
                                    } else {
                                        data[id] = {one: values[i].total, oneMoney: money, ten: 0, tenMoney: 0};
                                    }
                                    datas[wuid] = data;
                                }
                            }
                            for(wuid in datas) {
                                for(id in datas[wuid]) {
                                    stash.data.push({
                                        wuid    : wuid, 
                                        server  : servers[start].i,     
                                        id      : id,
                                        oneCount: datas[wuid][id].one,
                                        oneMoney: datas[wuid][id].oneMoney,
                                        tenCount: datas[wuid][id].ten,
                                        tenMoney: datas[wuid][id].tenMoney,
                                        date    : date
                                    });
                                }
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

var download = function(stash, callback) {
    stash.data.push(['wuid','区服','选秀ID','单抽次数','单抽货币消耗','十连次数','十连货币消耗','查询日期','VIP']);
    query(stash, function(error, doc) {
        return callback(null, stash);
    });
};
