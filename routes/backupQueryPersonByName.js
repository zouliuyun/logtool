var async = require('async');
var mongoLong = require('mongodb').Long;
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');

var handler = module.exports;

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "游戏名称查询个人信息";
    _stash.area = utilityFunc.area; 
    
    async.series({
        check: function(callback) {
            return checkArguments(_stash, callback);
        },
        queryBase: function(callback) {
            if (!_stash.name) return callback(null);
            
            query(req.app, _stash, function(error, doc) {
                return callback(error);
            });
        },
    }, function(error, doc) {
        if(error) _stash.error = error;
        console.log('======>>0102:\t', _stash);
        return res.render('backupQueryPersonByName', {stash: _stash});
    });
};

var checkArguments = function(stash, callback) {
    console.log('======>>0101:\t', stash);
    return callback(null);
};

var query = function(app, stash, cb) {
    stash.data = [];
    stash.startDate = stash.startDate.replace(/-/g, '');    
    console.log('test====>', stash.startDate);
    mongoDB.getGameDBBackUp(stash.platform, stash.version, 'game_user', stash.startDate, function(error, db, coll) {
        if (error) return cb(error);
        coll.find({n: stash.name}, {fields:{w:1, ct:1, t:1, vip:1, mid:1}}).toArray(function(error, docs) {
            if(error) return cb(error);
            if(!docs || docs.length < 1) return cb('查无此人!');
            for (var i in docs) {
                stash.data.push({
                    server: docs[i].w, 
                    mid: docs[i].mid, 
                    wuid: docs[i]._id, 
                    name: stash.name, 
                    vip: docs[i].vip[0], 
                    ct: utilityFunc.getDetailTime(docs[i].ct),
                    opt: utilityFunc.getDetailTime(docs[i].t)
                });
            }
            db.close();
            return cb(error);
        });
    });
};
