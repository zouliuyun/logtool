var handler = module.exports;

var async = require('async');
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "查询球员比赛情况";
    _stash.area = utilityFunc.area;
    _stash.data = [];
    
    console.log('=========>>>0101:\t', _stash);

    _stash.servers = utilityFunc.getAllServers();
    
    async.series({
        checkParam: function(callback) {    
            _stash.data = [];
            return callback(null);    
        },
        queryMatchToLog: function(callback) {

            if (_stash.ope == '1') {
                queryTianTiData(_stash, function(error, doc) {
                    return callback(error);
                });
            } else if (_stash.ope == '2') {
                queryPataData(_stash, function(error, doc) {
                    return callback(error);
                });
            } else if (_stash.ope == '3') {
                queryMyNBAData(_stash, function(error, doc) {
                    return callback(error);
                });
            } else {
                return callback(null);
            }
        }
    }, function(error, doc) {
        if(error) _stash.error = utilityFunc.getErrMsg(error); 
        console.log('==========>>>0102:\t', _stash);
        res.render('queryBattleDataAsWuid', {stash: _stash});
    });
};

var queryTianTiData = function(stash, cb) {
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86000;
    var _sql = {f0: 119, f1: {$gte: utilityFunc.getTimestamp(stash.startDate), $lt: endTime}};
    var version = parseInt(stash.server) % 2 === 0;
    if(version) {
        _sql.f3 = 234;
        _sql.f2 = stash.wuid;
    } else {
        _sql.$or = [{f2: stash.wuid},{f5: stash.wuid}];
    }
    console.log('=========>>>0103:\t', _sql);
    mongoDB.getNBA2OpeDB(stash.platform, stash.server, function(error, db, coll) {
        if (error) return cb(error);
        
        coll.find(_sql).toArray(function(error, doc) {
            doc.forEach(function(elem) {
                if(version) {
                    stash.data.push({
                        wuid    : elem.f2, 
                        time    : utilityFunc.getDetailTime(elem.f1), 
                        p1      : elem.f5, 
                        tp      : elem.f8, 
                        rwuid   : elem.f4, 
                        fid     : elem.f7,
                        p2      : elem.f6 
                    });
                } else {
                    stash.data.push({
                        wuid    : stash.wuid, 
                        time    : utilityFunc.getDetailTime(elem.f1)
                    });
                }
            });
            db.close();
            return cb(error);
        });
    });
};

var queryPataData = function(stash, cb) {
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86000;
    var _sql = {f0: 111, f1: {$gte: utilityFunc.getTimestamp(stash.startDate), $lt: endTime}, f2: stash.wuid, f3: 160};
    console.log('=========>>>0103:\t', _sql);
    mongoDB.getNBA2OpeDB(stash.platform, stash.server, function(error, db, coll) {
        if (error) return cb(error);
        
        coll.find(_sql).toArray(function(error, doc) {
            doc.forEach(function(elem) {
                console.log('=========>>>0104:\t', elem);
                stash.data.push({wuid : elem.f2, time: utilityFunc.getDetailTime(elem.f1), id: elem.f4.g, r: elem.f4.r===true?'胜':'负'});
            });
            db.close();
            return cb(error);
        });
    });
};

var queryMyNBAData = function(stash, cb) {
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86000;
    var _sql = {f0: 123, f1: {$gte: utilityFunc.getTimestamp(stash.startDate), $lt: endTime}, f2: stash.wuid, f3: 190};
    console.log('=========>>>0103:\t', _sql);
    mongoDB.getNBA2OpeDB(stash.platform, stash.server, function(error, db, coll) {
        if (error) return cb(error);
        
        coll.find(_sql).toArray(function(error, doc) {
            doc.forEach(function(elem) {
                stash.data.push({wuid : elem.f2, time: utilityFunc.getDetailTime(elem.f1), rwuid: elem.f4.w, r: elem.f4.r===true?'胜':'负', date: utilityFunc.getDateTime(elem.f4.ldt)});
            });
            db.close();
            return cb(error);
        });
    });
};
