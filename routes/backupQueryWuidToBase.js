var async = require('async');
var mongoLong = require('mongodb').Long;
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');

var handler = module.exports;

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "游戏ID查询球队基本信息";
    _stash.area = utilityFunc.area;
    _stash.data = [];
    
    async.series({
        check: function(callback) {
            return checkArguments(_stash, _stash.btn, callback);
        },
        queryBase: function(callback) {
            if (!_stash.btn || _stash.btn != 'query') return callback(null);
            
            queryWuidToBase(req.app, _stash, function(error, doc) {
                return callback(null);
            });
        },
        downloadBase: function(callback) {
            if (!_stash.btn || _stash.btn != 'download') return callback(null);
            download(req.app, _stash, function(error, doc) {
                utilityFunc.downloadCSV(res, _stash.data, 'wuidToBase.csv'); 
                return callback(null);
            });
        },
    }, function(error, doc) {
        if (!_stash.btn || _stash.btn != 'download') {
            return res.render('backupQueryWuidToBase', {stash: _stash});
        }
    });
};

var checkArguments = function(stash, type, callback) {
    console.log('======>>0101:\t', stash, type);
    return callback(null);
};

var queryWuidToBase = function(app, stash, cb) {
    stash.startDate = stash.startDate.replace(/-/g, '');
    stash.wuids = stash.wuids.split('\r\n');
    if (Array.isArray(stash.wuids) === false) return cb(null);
    
    mongoDB.getGameDBBackUp(stash.platform, stash.version, 'game_user', stash.startDate, function(error, db, coll) {
        if(error) return cb(error);
        var start = 0;
        async.whilst(
            function() {return start < stash.wuids.length;},
            function(callback) {
                if(stash.wuids[start] <= 0) {
                    console.log('==>>invalid wuid: ', stash.wuids[start]);
                    ++start;
                    return callback(null);
                }

                coll.findOne({_id: mongoLong.fromString(stash.wuids[start])}, {w:1,n:1,t:1,vip:1}, function(error, doc) {
                    if (doc) {
                    stash.data.push({wuid: stash.wuids[start], server: doc.w, name: doc.n, login: utilityFunc.getDetailTime(doc.t), vip: doc.vip[0]});
                    } else {
                        stash.data.push({wuid: stash.wuids[start], server: 0, name: 'null', login: 'null', vip: 0});
                    }
                    ++start;
                    return callback(null);
                });
            },
            function(error) {
                db.close();
                return cb(null);
            }
        );
    });
};

var download = function(app, stash, callback) {
    stash.data.push(['wuid','区服','名称','上次登陆时间','VIP']);
    queryWuidToBase(app, stash, function(error, doc) {
        return callback(null, stash);
    });
};
