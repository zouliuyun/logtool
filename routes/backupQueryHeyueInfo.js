var async = require('async');
var mongoLong = require('mongodb').Long;
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');

var handler = module.exports;

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "游戏ID查询个人合约信息";
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
        return res.render('backupQueryHeyueInfo', {stash: _stash});
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
        coll.findOne({_id: mongoLong.fromString(stash.wuid)},{ii:1}, function(error, doc) {
            if(error) return cb(error);
            console.log('======>>0102:\t', doc);
            if (doc && doc.ii) {
                for (var i in doc.ii) {
					if(doc.ii[i].i >= 24001 && doc.ii[i].i <= 24205 ) {
						stash.data.push({
							wuid: stash.wuid, 
							iiID  : doc.ii[i].i, 
							iiName: utilityFunc.getHeyueName(stash.platform, doc.ii[i].i), 
							amount    : doc.ii[i].a
						});
					}
                }
            }
            
            db.close();
            return cb(null);
        });
    });
};
