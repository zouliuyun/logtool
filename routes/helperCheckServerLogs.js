var handler = module.exports;

var async = require('async');
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "日志入库检测";
    _stash.area = utilityFunc.area;
    
    console.log('=========>>>0101:\t', _stash);

    _stash.servers = utilityFunc.getAllServers();
    
    async.series({
        checkParam: function(callback) {    
            _stash.data = [];
            return callback(null);    
        },
        queryBase: function(callback) {
            if (!_stash.btn || _stash.btn != 'query') {
                return callback(null);
            }

            query(_stash, function(error, doc) {
                return callback(error);
            });
        },
    }, function(error, doc) {
        res.render('helperCheckServerLogs', {stash: _stash});
        console.log('over====>', error, _stash);
    });
};

var query = function(stash, cb) {
    stash.startDate = stash.startDate.replace(/-/g, '');
    var server = parseInt(stash.server);
    var sql, suffix;
    if(stash.ope == 1) { //检测漏传
        sql = {process: {$ne: 2}}; 
        if(server > 0) sql.server = server;
        if(parseInt(stash.startDate) > 0) sql.date = stash.startDate;
    } else if(stash.ope == 2) { //查询入库
        sql = {process: 2}; 
        if(server > 0) sql.server = server;
        if(parseInt(stash.startDate) > 0) sql.date = stash.startDate;
    } else {
        return cb(null);
    }
    console.log('=========>>>0103:\t', sql);
    mongoDB.getNBA2OpeConfigDB(stash.platform, 'nba2_game_log', function(error, db, coll) {
        if (error)  return cb(error);
        coll.find(sql).toArray(function(error, docs) {
            docs.forEach(function(elem) {
                if(stash.ope == 1) suffix = '部分导入';
                else suffix = '导入成功';
                stash.data.push({
                    server  : elem.server, 
                    date    : elem.date,
                    info    : 'Node' + elem.node + suffix
                });
            });
            return cb(null);
        });
    });
};
