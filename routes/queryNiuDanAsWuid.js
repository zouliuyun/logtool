var handler = module.exports;

var async = require('async');
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "查询选秀信息";
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
        res.render('queryNiuDanAsWuid', {stash: _stash});
    });
};

var query = function(stash, cb) {
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86000;
    var subID = parseInt(stash.subID);
    var _sql = {};
    if (isNaN(subID)) {
        _sql = {f0: 126, f1: {$gte: utilityFunc.getTimestamp(stash.startDate), $lt: endTime}, f2: stash.wuid, f3: 232}; 
    } else {
        _sql = {f0: 126, f1: {$gte: utilityFunc.getTimestamp(stash.startDate), $lt: endTime}, f2: stash.wuid, f3: 232, 'f4.i': subID};  
    }
    console.log('=========>>>0103:\t', _sql);
    mongoDB.getNBA2OpeDB(stash.platform, stash.server, function(error, db, coll) {
        if (error) return cb(error);
        coll.find(_sql).toArray(function(error, doc) {
            doc.forEach(function(elem) {
                console.log('=========>>>0104:\t', elem);
                stash.data.push({
                    time   : utilityFunc.getDetailTime(elem.f1), 
                    tid    : elem.f4.i,
                    count  : elem.f4.lc,
                    cinfo  : utilityFunc.formateItemsData(stash.platform, elem.f4.cost)
                });
            });
            db.close();
            return cb(null);
        });
    });
};
