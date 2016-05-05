var async = require('async');
var actionType = require('../config/ActionType').data;
var utilityFunc = require('../models/UtilityFunction');
var handler = module.exports;

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "玩家操作表";
    _stash.data = [];
    
    async.series({
        queryBase: function(callback) {
            if(_stash.btn == 'download') {
                _stash.data.push(['操作类型','操作名称']);
            }

            query(_stash, function(error, doc) {
                return callback(error);
            });
        },
        downloadBase: function(callback) {
            if (!_stash.btn || _stash.btn != 'download') return callback(null);
            utilityFunc.downloadCSV(res, _stash.data, 'actionType.csv'); 
            return callback(null);
        },
    }, function(error, doc) {
        if(error) _stash.error = utilityFunc.getErrMsg(error); 
        if (!_stash.btn || _stash.btn != 'download') {
            res.render('helperActionType', {stash: _stash});
        }
    });
};

var query = function(stash, cb) {
    for (var key in actionType) {
        stash.data.push({id:key, name: actionType[key]});
    }
    return cb(null);
};
