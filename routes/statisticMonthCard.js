var handler = module.exports;

var async = require('async');
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "月卡购买统计";
    _stash.area = utilityFunc.area;
    
    console.log('=========>>>0101:\t', _stash);

    _stash.servers = utilityFunc.getAllServers();
    
    async.series({
        checkParam: function(callback) {    
            _stash.data = [];
            return callback(null);    
        },
        queryBase: function(callback) {
            if (!_stash.btn) {
                return callback(null);
            }

            if(_stash.btn == 'download') {
                _stash.data.push(['区服','wuid','时间','查询日期']);
            }

            query(_stash, function(error, doc) {
                return callback(error);
            });
        },
        downloadBase: function(callback) {
            if (!_stash.btn || _stash.btn != 'download') return callback(null);
            utilityFunc.downloadCSV(res, _stash.data, 'statisticMonthCard.csv'); 
            return callback(null);
        },
    }, function(error, doc) {
        if (!_stash.btn || _stash.btn != 'download') {
            res.render('statisticMonthCard', {stash: _stash});
        }
        console.log('over====>', error);
    });
};

var query = function(stash, cb) {
    var startTime = utilityFunc.getTimestamp(stash.startDate);
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86000;
    var server = parseInt(stash.server);
    var date = stash.startDate.replace(/-/g, '') + '-' + stash.endDate.replace(/-/g, '');
    
    var _sql = {uid: {$exists:false}, createTime: {$gte: startTime, $lte: endTime}};
    if (server > 0) _sql.worldId = server;
    console.log('======>>0103:\t', _sql);
    mongoDB.getGameDBBackUp(stash.platform, stash.version, 'recharge_history', utilityFunc.getMongoDate(), function(error, db, coll) {
        if (error) return cb(error);
        coll.find(_sql).toArray(function(error, doc) {
            if (doc && doc.length > 0) {
                for (var i in doc) {
                    stash.data.push({
                        wuid:   doc[i].wuid, 
                        server: doc[i].worldId, 
                        ct:     utilityFunc.getDetailTime(doc[i].createTime),
                        date:   date
                    });
                }
            } 
            db.close();
            return cb(error);
        });
    });
};
