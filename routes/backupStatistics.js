var async = require('async');
var mongoLong = require('mongodb').Long;
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');
var itemType = require('../models/ItemType');

var handler = module.exports;

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.data = [];
    _stash.title = "备库统计信息";
    _stash.area = utilityFunc.area; 
    _stash.servers = utilityFunc.getAllServers();
    
    async.series({
        check: function(callback) {
            return checkArguments(_stash, callback);
        },
        queryBase: function(callback) {
            if (_stash.ope == '1') {
                levelStatistic(_stash, function(error, doc) {
                    return callback(null);
                });
            } else if (_stash.ope == '2') {
                vipStatistic(_stash, function(error, doc) {
                    return callback(null);
                });
            } else if (_stash.ope == '3') {
                friendStatistic(_stash, function(error, doc) {
                    return callback(null);
                });
            } else {
                return callback(null);
            }
        },
        downloadBase: function(callback) {
            if (!_stash.btn || _stash.btn != 'download') return callback(null);
            var title;
            if (_stash.ope == '3') title = ['区服','wuid','名称','好友数量'];
            else if (_stash.ope == '1' || _stash.ope == '2') title = ['等级','人数'];
            _stash.data.splice(0,0,title);
            utilityFunc.downloadCSV(res, _stash.data, 'backupStatistics.csv');
            return callback(null);
        }
    }, function(error, doc) {
        console.log('==========>>>0102:\t', _stash);
        if (!_stash.btn || _stash.btn != 'download') {
            return res.render('backupStatistics', {stash: _stash});
        }
    });
};

var checkArguments = function(stash, callback) {
    console.log('======>>0101:\t', stash);
    return callback(null);
};

var levelStatistic = function(stash, cb) {
    var server = parseInt(stash.server); 
    stash.startDate = stash.startDate.replace(/-/g, '');
    var sql = null;
    if (server > 0) sql = {w: server};
    mongoDB.getGameDBBackUp(stash.platform, stash.version, 'game_user', stash.startDate, function(error, db, coll) {
        if (error) return cb(error);
        coll.find(sql, {fields:{ii:1}}).toArray(function(error, values) {
            console.log('======>>0104:\t', error);
            if (!error) {
                var results = {}; 
                for (var i = 0; i < values.length; ++i) {
                    var value = itemType.ItemValue.ItemValue_GetValues(values[i].ii, [itemType.ItemValue.Team_Exp]);
                    var level = utilityFunc.getTeamLevelByExp(stash.platform, value[0]);
                    if(results[level]) results[level] += 1;
                    else results[level] = 1;
                }
                console.log('======>>0111:\t', results);
                for (var key in results) {
                    stash.data.push({level: key, count: results[key]});
                }
            }                
            db.close();
            return cb(error);
        });
    });
};

var vipStatistic = function(stash, cb) {
    var server = parseInt(stash.server); 
    stash.startDate = stash.startDate.replace(/-/g, '');
    var sql = null;
    if (server > 0) sql = {w: server};
    mongoDB.getGameDBBackUp(stash.platform, stash.version, 'game_user', stash.startDate, function(error, db, coll) {
        if (error) return cb(error);
        coll.find(sql, {fields:{vip:1}}).toArray(function(error, values) {
            console.log('======>>0104:\t', error);
            if (!error) {
                var results = {}; 
                for (var i = 0; i < values.length; ++i) {
                    var vip = values[i].vip[0];
                    if(results[vip]){
                        results[vip] += 1;
                    } else {
                        results[vip] = 1;
                    }
                }
                console.log('======>>0111:\t', results);
                for (var key in results) {
                    stash.data.push({level: key, count: results[key]});
                }
            }
            db.close();
            return cb(error);
        });
    });
};

var friendStatistic = function(stash, cb) {
    var server = parseInt(stash.server); 
    stash.startDate = stash.startDate.replace(/-/g, '');
    var sql = null;
    if (server > 0) sql = {w: server};
    mongoDB.getGameDBBackUp(stash.platform, stash.version, 'game_user', stash.startDate, function(error, db, coll) {
        if (error) return cb(error);
        coll.find(sql, {fields:{n:1,w:1,fu:1}}).toArray(function(error, values) {
            console.log('======>>0104:\t', error);
            if (!error) {
                for (var i = 0; i < values.length; ++i) {
                    stash.data.push({server: values[i].w, wuid: values[i]._id, name: values[i].n, count: values[i].fu.length});
                }
            }
            stash.data.sort(function(item1, item2) { return item2.count - item1.count;});
            db.close();
            return cb(error);
        });
    });
};
