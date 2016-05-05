var handler = module.exports;

var async = require('async');
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "查询登陆信息";
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
                        console.log('========>>>00011012:\t', error, doc);
                    return callback(null);
                });
            } else {
                return callback(null);
            }
        }
    }, function(error, doc) {
        console.log('==========>>>0102:\t', _stash);
        res.render('queryLoginInfoAsWuid', {stash: _stash});
    });
};

var query = function(stash, cb) {
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86400;
    var _sql = {f0: {$in: [109, 110]}, f1: {$gte: utilityFunc.getTimestamp(stash.startDate), $lt: endTime}, f2: stash.wuid, f3: {$in: [243, 244]}}; 
    console.log('=========>>>0103:\t', _sql);
    mongoDB.getNBA2OpeDB(stash.platform, stash.server, function(error, db, coll) {
        if (error) return cb(error);
        coll.find(_sql).toArray(function(error, doc) {
                console.log('========>>>00011010:\t', error, doc);
            doc.forEach(function(elem) {
                console.log('=========>>>0104:\t', elem);
                stash.data.push({
                    userId: elem.f2,
                    time : utilityFunc.getDetailTime(elem.f1),
                    eventId: utilityFunc.getActionName(elem.f3),
                    data: utilityFunc.formateItemsData(stash.platform, elem.f4)
                });
                stash.data.sort(function(item1, item2) { return new Date(item1.time).getTime() - new Date(item2.time).getTime();});
            });
            db.close();
            return cb(null);
        });
    });
};
