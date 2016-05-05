var handler = module.exports;

var async = require('async');
var xlsx = require('node-xlsx'); 
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');
var ItemValue = require('../models/ItemType').ItemValue;

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "开服数据统计";
    _stash.area = utilityFunc.area;
    
    console.log('=========>>>0101:\t', _stash);

    _stash.servers = utilityFunc.getAllServers();
    
    async.series({
        checkParam: function(callback) {    
            _stash.data = [];
            return callback(null);    
        },
        downloadBase: function(callback) {
            if (!_stash.btn || _stash.btn != 'download') return callback(null);
            query(_stash, res, function(error, doc) {
                //if(!error) utilityFunc.downloadCSV(res, _stash.data, 'openServerDatas.csv'); 
                return callback(error);
            });
        },
    }, function(error, doc) {
        console.log('over====>error: ',error);
        if(error) _stash.error = utilityFunc.getErrMsg(error); 
        if (!_stash.btn || _stash.btn != 'download') {
            res.render('statisticOpenServer', {stash: _stash});
        }
    });
};

var query = function(stash, res, cb) {
    async.parallel({
        db: function(callback){
            queryDB(stash, callback);
        },
        log: function(callback){
            queryLog(stash, callback);
        }
    },
    function(err, results) {
        if(err)  return cb(err);
        var sheets = [];
        sheets.push({name: "20及以上等级球队表", data:results.db.level});
        sheets.push({name: "A及以上品阶球员表", data:results.db.quality});
        if(stash.version && stash.version == 2) { //简体IOS
            sheets.push({name: "紫色及以上品质球员表", data:results.db.star});
            sheets.push({name: "2次及以上钻石十连抽表", data:results.log.money});
        } else {
            sheets.push({name: "蓝色及以上品质球员表", data:results.db.star});
            sheets.push({name: "3次及以上钻石十连抽表", data:results.log.money});
        }
        sheets.push({name: "5次及以上金币十连抽表", data:results.log.coin});
        var buffer = xlsx.build(sheets); 
        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader("Content-Disposition", "attachment; filename=" + "openServerDatas.xlsx");
        res.end(buffer, 'binary');
        cb(null);
    });
};

var queryDB = function(stash, cb) {
    var teamLevelLimit = 20, cardStarLimit = 3, cardQualityLimit = 4;
    //简体IOS为紫色
    if(stash.version && stash.version == 2) cardStarLimit = 6;
    var teamExpLimit = utilityFunc.getTeamExpByLevel(stash.platform, teamLevelLimit);
    if(teamExpLimit < 0) return cb('internal');
    var server = parseInt(stash.server); 
    var startDate = stash.startDate.replace(/-/g, '');
    var endDate = stash.endDate.replace(/-/g, '');
    var date = startDate + '-' + endDate;
    var dataLevel  = [['Server','Wuid', 'Vip', 'Level', 'Date']];
    var dataStar   = [['Server','Wuid', 'Vip', 'Numer', 'Date']];
    var dataQuality= [['Server','Wuid', 'Vip', 'Number', 'Date']];
    mongoDB.getGameDBBackUp(stash.platform, stash.version, 'game_user', endDate, function(error, db, coll) {
        if (error) return cb(error);

        coll.find({w: server}, {fields:{vip:1, ii:1, card:1}}).toArray(function(error, values) {
            console.log('======>>0103:\t', error);
            if (!error) {
                for (var i = 0; i < values.length; ++i) {
                    if(values[i].ii) {
                        var value = ItemValue.ItemValue_GetValue(values[i].ii, ItemValue.Team_Exp);
                        if(value >= teamExpLimit) {
                            var _level = utilityFunc.getTeamLevelByExp(stash.platform, value);
                            dataLevel.push([server, values[i]._id.toString(), values[i].vip[0], _level, date]);
                        }
                    }
                    if(values[i].card) {
                        var starNum = 0, qualityNum = 0;
                        for(var j=0; j < values[i].card.length; j++){ 
                            if(cardStarLimit <= values[i].card[j].s) ++ starNum;
                            if(cardQualityLimit <= values[i].card[j].q) ++ qualityNum;
                        }
                        if(starNum > 0) dataStar.push([server, values[i]._id.toString(), values[i].vip[0], starNum, date]);
                        if(qualityNum > 0) dataQuality.push([server, values[i]._id.toString(), values[i].vip[0], qualityNum, date]);
                    }
                }
            }
            db.close();
            return cb(error, {'level': dataLevel,'star': dataStar,'quality': dataQuality});
        });
    });
};

var queryLog = function(stash, cb) {
    var startTime = utilityFunc.getTimestamp(stash.startDate);
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86000;
    var date = stash.startDate.replace(/-/g, '') + '-' + stash.endDate.replace(/-/g, '');
    var server = parseInt(stash.server);
    var sql = {f0: 126, f1: {$gte: startTime, $lt: endTime}, f3: 232, 'f4.i': {$in: [1001, 2001]}, 'f4.lc': 10};
    var limitMoneyCount = 3;
    //简体IOS钻石十连抽为2次
    if(stash.version && stash.version == 2) limitMoneyCount = 2;
    var moneyData = [['Server','Wuid','Count','Date']];
    var coinData = [['Server','Wuid','Count','Date']];
    console.log('=========>>>0103:\t', sql);
    mongoDB.getNBA2OpeDB(stash.platform, stash.server, function(error, db, coll) {
        if (error) return cb(error);
        coll.aggregate([
                {$match: sql}, 
                {$group: {_id: {wuid: '$f2', id: '$f4.i'}, count: {$sum: 1}}}
        ], function(error, values){
            if(error) return cb(error);
            var wuid = 0, id = 0;
            for (var i = 0; i < values.length; ++i) {
                if(values[i]._id.id == 2001 && values[i].count >= limitMoneyCount) {
                    moneyData.push([server, values[i]._id.wuid.toString(), values[i].count, date]);
                } else if(values[i]._id.id == 1001 && values[i].count >= 5) {
                    coinData.push([server, values[i]._id.wuid.toString(), values[i].count, date]);
                }
            }
            db.close();
            return cb(null, {'money': moneyData, 'coin': coinData});
        });
    });
};

