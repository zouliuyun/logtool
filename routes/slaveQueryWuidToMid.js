var async = require('async');
var mongoLong = require('mongodb').Long;
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');

var handler = module.exports;

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "从库游戏ID查询梦宝谷ID";
    _stash.area = utilityFunc.area; 

    console.log('======>>0100:\t', req.query.method);
    _stash.show = req.query.method;
    
    async.series({
        check: function(callback) {
            if (!_stash.btn) return callback(null);
            
            checkArguments(_stash, _stash.btn, function(error) {
                return callback(error);
            });
        },
        query: function(callback) {
            if (!_stash.btn || _stash.btn != 'query') return callback(null);
            
            queryWuidToMid(req.app, _stash, function(error, doc) {
                return callback(null);
            });
        },
        dowload: function(callback) {
            if (!_stash.btn || _stash.btn != 'download') return callback(null);
            
            downloadWuidToMid(req.app, _stash, function(error, doc) {
                utilityFunc.downloadCSV(res, _stash.data, 'wuidToMid.csv'); 
                return callback(null);
            });
        }
    }, function(error, doc) {
        if (!_stash.btn || _stash.btn != 'download') {
            return res.render('slaveQueryWuidToMid', {stash: _stash});
        }
    });
};

var checkArguments = function(stash, type, callback) {
    console.log('======>>0101:\t', stash);
    return callback(null);
};

var queryWuidToMid = function(app, stash, callback) {
    stash.wuids = stash.wuids.split('\r\n');
    stash.data = [];
    if (!Array.isArray(stash.wuids)) return callback(null);

    mongoDB.getLoginDBSlave(stash.platform, stash.version, 'common_user', function(error, db, coll) {
        console.log('======>>0107:\t', error);
        if (error) return callback(error);
        var start = 0;
        async.whilst(
            function() {return start < stash.wuids.length;},
            function(cb) {
                if(stash.wuids[start] <= 0) {
                    console.log('==>invalid wuid: ', stash.wuids[start]);
                    ++start;
                    return cb(null);
                }

                var _id = mongoLong.fromString(stash.wuids[start].toString()).getHighBits();
                //coll.findOne({_id: _id}, function(error, doc) {
                coll.findOne({"u._id": mongoLong.fromString(stash.wuids[start].toString())}, function(error, doc) {
                    if (!error && doc && doc.u) {
                        var firstRegTime = 0;
                        if (doc.u.length > 0) firstRegTime = utilityFunc.getRegisterDateTime(doc.u[0]._id);
                        stash.data.push({mid: doc.mid, wuid: stash.wuids[start].toString(), num: doc.u.length, fRegister: firstRegTime, register: utilityFunc.getRegisterDateTime(stash.wuids[start].toString())});
                    }
                    ++start;
                    cb(null);
                });
            },
            function(error, doc) {
                console.log('======>>0103:\t', error, stash.data);
                db.close();
                return callback(error);
            }
        );
    });
};

var downloadWuidToMid = function(app, stash, callback) {
    stash.data.push(['mid','wuid','账号数量','首次注册时间','注册时间']);
    return queryWuidToMid(app, stash, callback);
};

