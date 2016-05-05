var handler = module.exports;

var async = require('async');
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "查询礼包信息";
    _stash.area = utilityFunc.area;
    
    console.log('=========>>>0101:\t', _stash);

    _stash.servers = utilityFunc.getAllServers();
    
    async.series({
        checkParam: function(callback) {    
            _stash.data = [];
            return callback(null);    
        },
        queryBase: function(callback) {
            if (_stash.wuid != '0') {
                query(_stash, function(error, doc) {
                    return callback(null);
                });
            } else {
                return callback(null);
            }
        }
    }, function(error, doc) {
        console.log('==========>>>0102:\t', _stash);
        res.render('queryGiftPackageAsWuid', {stash: _stash});
    });
};

var query = function(stash, cb) {
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86000;
    var _sql = {f0: 121, f1: {$gte: utilityFunc.getTimestamp(stash.startDate), $lt: endTime}, f2: stash.wuid, f3: 132}; //活动商城购买
    if (stash.subID && stash.subID !== '') {
        _sql.f5 = parseInt(stash.subID);
    }    
    console.log('=========>>>0103:\t', _sql);
    mongoDB.getNBA2OpeDB(stash.platform, stash.server, function(error, db, coll) {
        if (error) return cb(error);
        coll.find(_sql).toArray(function(error, doc) {
            doc.forEach(function(elem) {
                console.log('=========>>>0104:\t', elem);
                stash.data.push({
                    time : utilityFunc.getDetailTime(elem.f1), 
                    id   : elem.f5,
                    name : utilityFunc.getGiftPackName(stash.platform, elem.f5),
                    num  : elem.f4
                });
            });
            db.close();
            return cb(null);
        });
    });
};
