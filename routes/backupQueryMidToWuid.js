var async = require('async');
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');

var handler = module.exports;

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "梦宝谷ID查询球队信息";
    _stash.area = utilityFunc.area;
    
    async.series({
        check: function(callback) {
            if (!_stash.btn) return callback(null);
            
            checkArguments(_stash, function(error) {
                return callback(error);
            });
        },
        query:function(callback) {
            if (!_stash.btn || _stash.btn != 'query') return callback(null);
            
            query(req.app, _stash, function(error, doc) {
                return callback(error);
            });
        },
        download:function(callback) {
            if (!_stash.btn || _stash.btn != 'download') return callback(null);
            
            download(req.app, _stash, function(error, doc) {
                _stash.data.splice(0,0,['mid', 'wuid', 'name', 'VIP', '最后登录时间', '注册日期']); 
                utilityFunc.downloadCSV(res, _stash.data, 'midToWuid.csv'); 
                return callback(null);
            });
        }
    }, function(error, doc) {
        if(_stash.btn) console.log('midsTowuids==> ', _stash.mids.length, _stash.data.length);
        if(error) _stash.error = error;
        if (!_stash.btn || _stash.btn != 'download') {
            res.render('backupQueryMidToWuid', {stash: _stash});
        }
    });
};

function checkArguments(stash, callback) {
    console.log('======>>0101:\t', stash);
    return callback(null);
}

function query(app, stash, callback) {
    stash.startDate = stash.startDate.replace(/-/g, '');
    stash.mids = stash.mids.split('\r\n');
    for(var i = 0; i < stash.mids.length;) {
        var mid = parseInt(stash.mids[i]);
        if(!!mid) {
            stash.mids[i] = mid;
            ++ i;
        } else {
            console.error('query==>mid is invalid: ', stash.mids[i]);
            stash.mids.splice(i, 1);
        }
    }
    stash.data = [];
    mongoDB.getGameDBBackUp(stash.platform, stash.version, 'game_user', stash.startDate, function(error, db, coll) {
        if(error) {
            console.error('query==>get db err: ', error);
            return callback(error);
        }
        coll.find({mid: {$in: stash.mids}}, 
                  {w: 1, ct:1, t:1, n:1, vip:1, mid:1}).toArray(function(error, values) {
            console.log('step: ', error, values.length);
            if (error) {
                console.error('query==>find err: ', error);
                db.close();
                return callback(error);
            }
            values.forEach(function(item) {
                stash.data.push({
                    mid     : item.mid, 
                    wuid    : item._id, 
                    server  : item.w, 
                    name    : item.n, 
                    vip     : item.vip[0], 
                    opt     : utilityFunc.getDetailTime(item.t), 
                    ct      : utilityFunc.getDetailTime(item.ct)
                });
            });
            db.close();
            return callback(null);
        });
    });
}

function download(app, stash, callback) {
    query(app, stash, function(error, doc) {
        return callback(null, stash);
    });
}
