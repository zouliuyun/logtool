var async = require('async');
var mongoLong = require('mongodb').Long;
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');

var handler = module.exports;

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "游戏ID查询个人卡牌信息";
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
        return res.render('backupQueryCardInfo', {stash: _stash});
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
        coll.findOne({_id: mongoLong.fromString(stash.wuid)}, {card : 1}, function(error, doc) {
            if(error) return cb(error);
            console.log('======>>0102:\t', doc);
            var tx, txp;
            if (doc && doc.card) {
                for (var i in doc.card) {
                    var cardLevel = utilityFunc.getCardLevelByExp(stash.platform, doc.card[i].ex);
                    if(doc.card[i].tx) tx = doc.card[i].tx;
                    else tx = [0, 0, 0, 0, 0, 0, 0, 0, 0];
                    if(doc.card[i].txp) txp = doc.card[i].txp;
                    else txp = 0;
                    stash.data.push({
                        wuid: stash.wuid, 
                        cardID  : doc.card[i].i, 
                        cardName: utilityFunc.getCardName(stash.platform, doc.card[i].i), 
                        star    : doc.card[i].s,
                        quality : doc.card[i].q,
                        level   : cardLevel,
                        txp     : txp,
                        tx      : tx,
                        career  : doc.card[i].c
                    });
                }
            }
            
            db.close();
            return cb(null);
        });
    });
};
