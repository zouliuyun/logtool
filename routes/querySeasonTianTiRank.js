var async = require('async');
var mongoLong = require('mongodb').Long;
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');
var handler = module.exports;

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "查询历史天梯排名";
    _stash.area = utilityFunc.area;
    _stash.data = [];
    
    _stash.servers = utilityFunc.getAllServers();
    
    async.series({
        checkParam: function(callback) {
            checkArguments(_stash, callback);
        },
        queryBase: function(callback) {
            if (!_stash.btn || _stash.btn != 'query') return callback(null);
            
            query(_stash, function(error, doc) {
                return callback(error);
            });
        },
        downloadBase: function(callback) {
            if (!_stash.btn || _stash.btn != 'download') return callback(null);
            download(_stash, function(error, doc) {
                if(!error) utilityFunc.downloadCSV(res, _stash.data, 'querySeasonTianTiRank.csv'); 
                return callback(error);
            });
        },
    }, function(error, doc) {
        if(error) _stash.error = utilityFunc.getErrMsg(error); 
        console.log('======>>over:\t', error, _stash);
        if (!_stash.btn || _stash.btn != 'download') {
            res.render('querySeasonTianTiRank', {stash: _stash});
        }
    });
};

var checkArguments = function(stash, callback) {
    console.log('======>>0101:\t', stash);
    return callback(null);
};

var query = function(stash, cb) {
    var server = parseInt(stash.server);
    var season = parseInt(stash.subID);
    if(isNaN(server) || server <= 0 || isNaN(season) || season < 0) return cb('invalid');
    var sc = server * 10000 + season;
    var sql = {'s' : sc};
    
    console.log('======>>0103:\t', sql);
    mongoDB.getGameDBBackUp(stash.platform, stash.version, 'track_tianti_rank', utilityFunc.getMongoDate(), function(error, db, coll) {
        if (error) return cb(error);
        coll.find(sql).sort({'p': 1}).toArray(function(error, docs) {
            if(error) return cb(error);
            if (stash.btn && stash.btn == 'query' && docs.length > 0) {
                stash.data.push({id: docs[0]._id});
            }
            for (var i = 0; i < docs.length; ++i) {
                stash.data.push({server: server, wuid: docs[i].u, name: docs[i].n, rank: docs[i].p+1, score: docs[i].v});
            }
            db.close();
            return cb(error);
        });
    });
};

var download = function(stash, callback) {
    stash.data.push(['区服','wuid','名称','排名','得分']);
    query(stash, function(error, doc) {
        return callback(null, stash);
    });
};
