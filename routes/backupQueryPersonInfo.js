var async = require('async');
var mongoLong = require('mongodb').Long;
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');
var itemType = require('../models/ItemType');

var handler = module.exports;

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "游戏ID查询个人基本信息";
    _stash.area = utilityFunc.area; 
    
    async.series({
        check: function(callback) {
            return checkArguments(_stash, callback);
        },
        queryBase: function(callback) {
            if (!_stash.wuid) return callback(null);
            
            query(req.app, _stash, function(error, doc) {
                return callback(error);
            });
        },
    }, function(error, doc) {
        if(error) _stash.error = error;
        console.log('=======>>0102', _stash);
        return res.render('backupQueryPersonInfo', {stash: _stash});
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
        coll.findOne({_id: mongoLong.fromString(stash.wuid)}, {fields:{w:1, n:1, vip:1, ii:1, ct:1, mid:1, 'tt.p':1}}, function(error, doc) {
            if(error || !doc || !doc.ii) {
                db.close();
                return cb('查无此人!');
            }
            var values = itemType.ItemValue.ItemValue_GetValues(doc.ii, [itemType.ItemValue.Money_Coin, itemType.ItemValue.Game_Coin, itemType.ItemValue.Team_Exp, itemType.ItemValue.Energy, 20008]);
            stash.data.push({mid: doc.mid, wuid: stash.wuid, server: doc.w, name: doc.n, vip: doc.vip[0], money: values[0], coin: values[1], exp: values[2], energy: values[3], ttr: values[4], ttp: doc.tt.p, ct: utilityFunc.getDetailTime(doc.ct)});
            db.close();
            return cb(error);
        });
    });
};
