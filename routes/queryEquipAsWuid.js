var handler = module.exports;

var async = require('async');
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "查询装备信息";
    _stash.area = utilityFunc.area; 
    
    console.log('=========>>>0101:\t', _stash);

    _stash.servers = utilityFunc.getAllServers();
    
    async.series({
        checkParam: function(callback) {    
            _stash.data = [];
            return callback(null);    
        },
        queryBase: function(callback) {
            if (_stash.ope == '1') {
                querySale(_stash, function(error, doc) {
                    return callback(null);
                });
            } else if (_stash.ope == '2') {
                queryLevelUp(_stash, function(error, doc) {
                    return callback(null);
                });
            } else {
                return callback(null);
            }
        }
    }, function(error, doc) {
        console.log('==========>>>0102:\t', _stash);
        res.render('queryEquipAsWuid', {stash: _stash});
    });
};

var querySale = function(stash, cb) {
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86000;
    var _sql = {f0: 122, f1: {$gte: utilityFunc.getTimestamp(stash.startDate), $lt: endTime}, f2: stash.wuid, f3: 153}; 
    console.log('=========>>>0103:\t', _sql);
    mongoDB.getNBA2OpeDB(stash.platform, stash.server, function(error, db, coll) {
        if (error) return cb(error);
        coll.find(_sql).toArray(function(error, doc) {
            doc.forEach(function(elem) {
                console.log('=========>>>0104:\t', elem);
                stash.data.push({
                    time : utilityFunc.getDetailTime(elem.f1), 
                    id   : elem.f4[0].i,
                    name : utilityFunc.getEquipName(stash.platform, elem.f4[0].i),
                    level: elem.f4[0].lv
                });
            });
            db.close();
            return cb(null);
        });
    });
};

var queryLevelUp = function(stash, cb) {
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86000;
    var _sql = {f0: 102, f1: {$gte: utilityFunc.getTimestamp(stash.startDate), $lt: endTime}, f2: stash.wuid, f3: 110}; 
    console.log('=========>>>0103:\t', _sql);
    mongoDB.getNBA2OpeDB(stash.platform, stash.server, function(error, db, coll) {
        if (error) return cb(error);
        coll.find(_sql).toArray(function(error, doc) {
            doc.forEach(function(elem) {
                console.log('=========>>>0104:\t', elem);
                stash.data.push({
                    time : utilityFunc.getDetailTime(elem.f1), 
                    id   : elem.f5.i,
                    name : utilityFunc.getEquipName(stash.platform, elem.f5.i),
                    inc  : elem.f4,
                    level: elem.f5.lv
                });
            });
            db.close();
            return cb(null);
        });
    });
};
