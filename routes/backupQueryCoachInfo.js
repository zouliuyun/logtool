var async = require('async');
var mongoLong = require('mongodb').Long;
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');

var handler = module.exports;

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "游戏ID查询个人教练信息";
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
        return res.render('backupQueryCoachInfo', {stash: _stash});
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
        coll.findOne({_id: mongoLong.fromString(stash.wuid)}, {coach : 1, m_coach : 1}, function(error, doc) {
            console.log('======>>0102:\t', doc);
            if (doc && doc.coach) 
                for (var i in doc.coach) {
                    var name = utilityFunc.getCoachName(stash.platform, doc.coach[i].i);
                    var level = utilityFunc.getCoachLevelByExp(stash.platform, doc.coach[i].exp);
                    if(doc.m_coach == doc.coach[i].i) {
                        name += "(MASTER COACH)";
                        //main coach push in first
                        stash.data.splice(0,0,{wuid: stash.wuid, coachID : doc.coach[i].i, coachName: name, cq: doc.coach[i].q, cl: level});
                    } else
                        stash.data.push({wuid: stash.wuid, coachID : doc.coach[i].i, coachName: name, cq: doc.coach[i].q, cl: level});
                }
            else 
                stash.data.push({wuid: stash.wuid, coachID: 0, coachName: 'null'});
            
            db.close();
            return cb(error);
        });
    });
};
