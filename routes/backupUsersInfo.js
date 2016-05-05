var async = require('async');
var mongoLong = require('mongodb').Long;
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');
var ItemValue = require('../models/ItemType').ItemValue;

var handler = module.exports;

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.data = [];
    _stash.title = "备库查询球队信息";
    _stash.area = utilityFunc.area;
    _stash.servers = utilityFunc.getAllServers();

    if(_stash.btn && _stash.btn != 'query') {
        if (_stash.ope == '1')  _stash.data.push(['区服','mid','wuid','名称','level','vip']);
        else if (_stash.ope == '2') _stash.data.push(['区服','mid','wuid','名称','结束日期','上次领取日期','领取次数']);
    }

    async.series({
        check: function(callback) {
            return checkArguments(_stash, callback);
        },
        queryBase: function(callback) {
            if (!_stash.btn || !_stash.ope) return callback(null);
            if (_stash.ope == 1) {
                queryUser(_stash, function(error, doc) {
                    return callback(error);
                });
            } else if (_stash.ope == 2) {
                queryMonthCard(_stash, function(error, doc) {
                    return callback(error);
                });
            }
        },
        downloadBase: function(callback) {
        if (!_stash.btn || _stash.btn != 'download') return callback(null);
            utilityFunc.downloadCSV(res, _stash.data, 'backupUsersInfo.csv'); 
            return callback(null);
        }
    }, function(error, doc) {
        console.log('======>>over:\t', error);
        if(error) _stash.error = utilityFunc.getErrMsg(error); 
        if (!_stash.btn || _stash.btn != 'download') {
            return res.render('backupUsersInfo', {stash: _stash});
        }
    });
};

var checkArguments = function(stash, callback) {
    if(stash.btn && !stash.startDate) return callback('invalid');
    console.log('======>>0101:\t', stash);
    return callback(null);
};

var queryUser = function(stash, cb) {
    var levelLimit = parseInt(stash.level);
    var vipLimit = parseInt(stash.vip);
    var server = parseInt(stash.server); 
    var expLimit = 0;
    var sql = null;
    if (server > 0) sql = {w: server};
    if (levelLimit > 0) expLimit = utilityFunc.getTeamExpByLevel(stash.platform, levelLimit);
    stash.startDate = stash.startDate.replace(/-/g, ''); 
    mongoDB.getGameDBBackUp(stash.platform, stash.version, 'game_user', stash.startDate, function(error, db, coll) {
        console.log('======>>0102:\t', sql, error);
        if (error) return cb(error);

        coll.find(sql, {fields:{w:1, n:1, mid:1, vip:1, ii:1}}).toArray(function(error, values) {
            console.log('======>>0103:\t', error);
            if (!error) {
                for (var i = 0; i < values.length; ++i) {
                    if(vipLimit > values[i].vip[0]) continue;
                    var exp = ItemValue.ItemValue_GetValue(values[i].ii, ItemValue.Team_Exp);
                    if(expLimit > exp) continue;
                    stash.data.push({
                        server  : values[i].w,
                        mid     : values[i].mid,
                        wuid    : values[i]._id,
                        name    : values[i].n,
                        level   : utilityFunc.getTeamLevelByExp(stash.platform, exp),
                        vip     : values[i].vip[0]
                    });
                }
            }
            db.close();
            return cb(error);
        });
    });
};

var queryMonthCard = function(stash, cb) {
    var nowDay = utilityFunc.getDayFromDate(stash.startDate);
    var sql = {'yk.30.d':{$gte: nowDay}};
    var server = parseInt(stash.server);
    if (server > 0) sql.w = server;
    stash.startDate = stash.startDate.replace(/-/g, ''); 
    mongoDB.getGameDBBackUp(stash.platform, stash.version, 'game_user', stash.startDate, function(error, db, coll) {
        console.log('======>>0102:\t', sql, error);
        if (error) return cb(error);
        coll.find(sql, {fields:{w:1, n:1, mid:1, 'yk.30':1}}).toArray(function(error, values) {
            console.log('======>>0103:\t', error);
            if (!error) {
                for (var i = 0; i < values.length; ++i) {
                    stash.data.push({
                        server  : values[i].w,
                        mid     : values[i].mid,
                        wuid    : values[i]._id,
                        name    : values[i].n,
                        end     : utilityFunc.getDateFromDay(values[i].yk[30].d),
                        la      : utilityFunc.getDateFromDay(values[i].yk[30].l),
                        c       : values[i].yk[30].c
                    });
                }
            }
            db.close();
            return cb(error);
        });
    });
};

