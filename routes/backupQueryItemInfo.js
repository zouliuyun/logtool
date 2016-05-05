var async = require('async');
var mongoLong = require('mongodb').Long;
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');

var handler = module.exports;

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "游戏ID查询个人装备信息";
    _stash.area = utilityFunc.area; 
    
    async.series({
        check: function(callback) {
            return checkArguments(_stash, callback);
        },
        queryBase: function(callback) {
            if (!_stash.wuid) return callback(null);
            
            query(req.app, _stash, function(error, doc) {
                return callback(null);
            });
        },
    }, function(error, doc) {
        return res.render('backupQueryItemInfo', {stash: _stash});
    });
};

var checkArguments = function(stash, callback) {
    console.log('======>>0101:\t', stash);
    return callback(null);
};

var query = function(app, stash, cb) {
    stash.data = [];
    stash.startDate = stash.startDate.replace(/-/g, '');
    
    mongoDB.getGameDBBackUp(stash.platform, stash.version, 'game_user', stash.startDate, function(error, db, coll) {
        if (error) return cb(error);
        coll.findOne({_id: mongoLong.fromString(stash.wuid)}, {item : 1}, function(error, doc) {
            console.log('======>>0102:\t', doc);
            if (doc && doc.item) {
                //order by deasc
                doc.item.sort(function(item1, item2) { return item2.lv - item1.lv;});
                for (var i in doc.item) {
                    stash.data.push({wuid: stash.wuid, equipID : doc.item[i].i, equipName: utilityFunc.getEquipName(stash.platform, doc.item[i].i), equipLevel : doc.item[i].lv, slot : doc.item[i].s});
                }
            } else 
                stash.data.push({wuid: stash.wuid, equipID: 0, equipName: 'null', equipLevel : 0, slot : 1000});
            
            db.close();
            return cb(error);
        });
    });
};
