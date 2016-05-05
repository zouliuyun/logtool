var handler = module.exports;

var async = require('async');
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "比赛统计";
    _stash.area = utilityFunc.area;
    
    console.log('=========>>>0101:\t', _stash);

    _stash.servers = utilityFunc.getAllServers();
    
    async.series({
        checkParam: function(callback) {    
            _stash.data = [];
            return callback(null);    
        },
        queryBase: function(callback) {
            if (!_stash.btn) return callback(null);
            
            if(_stash.btn == 'download') _stash.data.push(['区服','Wuid','参赛次数','时间']);
            query(_stash, function(error, doc) {
                return callback(error);
            });
        },
        downloadBase: function(callback) {
            if (!_stash.btn || _stash.btn != 'download') return callback(null);
            utilityFunc.downloadCSV(res, _stash.data, 'queryMatchInfo.csv'); 
            return callback(null);
        },
    }, function(error, doc) {
        if(error) _stash.error = utilityFunc.getErrMsg(error); 
        if (!_stash.btn || _stash.btn != 'download') {
            res.render('queryMatchInfo', {stash: _stash});
        }
        console.log('over====>', error);
    });
};

var query = function(stash, cb) {
    var startTime = utilityFunc.getTimestamp(stash.startDate);
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86000;
    var server = parseInt(stash.server);
    var servers = [];
    if (server > 0) servers = [{i: server}];
    else if (stash.platform == 1) servers = utilityFunc.getCNConfig();
    else servers = utilityFunc.getTWConfig();

    if (stash.platform == 1) {
        if(stash.server == -2) {
            servers = servers.filter(function(element, index, array) {
                return (element.i > 10000 || element.i % 2 == 1);
            });
        }
        else if(stash.server == -3) {
            servers = servers.filter(function(element, index, array) {
                return (element.i > 10000 || element.i % 2 === 0);
            });
        }
    }
    var sql;
    if(stash.ope == 1) {
        sql = {f0: 119, f1: {$gte: startTime, $lt: endTime}, f3: 233};
    } else if (stash.ope == 2) {
        sql = {f0: 123, f1: {$gte: startTime, $lt: endTime}, f3: 190};
    }
    console.log('=========>>>0103:\t', sql);

    var start = 0;
    async.whilst(
        function(){ return start < servers.length; },
        function(callback1){
            mongoDB.getNBA2OpeDB(stash.platform, servers[start].i, function(error, db, coll) {
                if (error) return callback1(error);
                var datas = {};
                coll.aggregate([
                        {$match: sql}, 
                        {$group: {_id: '$f2', total: {$sum: 1}}}
                ], function(error, values){
                    if(error) {
                        db.close();
                        return callback1(error);
                    }
                    for (var i = 0; i < values.length; ++i) {
                        stash.data.push({
                            server  : servers[start].i,     
                            wuid    : values[i]._id, 
                            count   : values[i].total,
                            date    : stash.startDate.replace(/-/g, '') + '-' + stash.endDate.replace(/-/g, '')
                        });
                    }
                    db.close();
                    ++ start;
                    return callback1(null);
                });
            });
        },
        function(error){
            return cb(error);
        }
    );
};

