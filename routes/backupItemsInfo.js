var fs = require('fs');
var async = require('async');
var spawn = require('child_process').spawn;
var mongoLong = require('mongodb').Long;
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');
var mail = require('../models/mail');

var handler = module.exports;

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.data = [];
    _stash.title = "备库统计物品拥有详情";
    _stash.area = utilityFunc.area;
    _stash.servers = utilityFunc.getAllServers();

    if(_stash.btn && _stash.btn != 'query') {
        if (_stash.ope == '1')  _stash.data.push(['区服','mid','wuid','名称','VIP','卡牌ID','卡牌星级','卡牌品阶','卡牌等级']);
        else if (_stash.ope == '2') _stash.data.push(['区服','mid','wuid','名称','VIP','教练ID','教练品阶','教练经验']);
        else if (_stash.ope == '3') _stash.data.push(['区服','mid','wuid','名称','VIP','装备ID','装备等级','装备位置']);
    }

    async.series({
        check: function(callback) {
            return checkArguments(_stash, callback);
        },
        queryEmail: function(callback) {
            return queryEmail(_stash, callback);
        },
        queryBase: function(callback) {
            if (_stash.ope == '1') {
                queryCard(_stash, function(error, doc) {
                    return callback(error);
                });
            } else if (_stash.ope == '2') {
                queryCoach(_stash, function(error, doc) {
                    return callback(error);
                });
            } else if (_stash.ope == '3') {
                queryEquip(_stash, function(error, doc) {
                    return callback(error);
                });
            } else {
                return callback(null);
            }
        },
        downloadBase: function(callback) {
            if (!_stash.btn || _stash.btn != 'download') return callback(null);
            var fileName = utilityFunc.genDownloadFileName('ItemInfo.csv', _stash.server, _stash.version);
            utilityFunc.downloadCSV(res, _stash.data, fileName);
            return callback(null);
        }
    }, function(error, doc) {
        if(error) _stash.error = utilityFunc.getErrMsg(error); 
        console.log('==========>>>0102:\t', error);
        if (!_stash.btn || _stash.btn != 'download') {
            return res.render('backupItemsInfo', {stash: _stash});
        }
    });
};

var checkArguments = function(stash, callback) {
    console.log('======>>0101:\t', stash);
    if(stash.btn && (!stash.startDate || stash.startDate.length != 10)) return callback('invalid');
    if(stash.btn == 'email') {
        var pattern = /^([a-zA-Z0-9]+[-_.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[-_.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,6}$/;
        if(!pattern.test(stash.email)) return callback('invalid');
    }
    return callback(null);
};

var queryCard = function(stash, cb) {
    var levelLimit = 0, starLimit = 0, qualityLimit = 0;
    if (stash.level && stash.level > 0) levelLimit = parseInt(stash.level);
    if (stash.star && stash.star > 0) starLimit = parseInt(stash.star);
    if (stash.quality && stash.quality > 0) qualityLimit = parseInt(stash.quality);
    var server = parseInt(stash.server); 
    var sql = {};
    if(stash.day) {
        var timestamp = utilityFunc.getTimestamp(stash.startDate) - parseInt(stash.day) * 86400; 
        sql = {t: {$gte: timestamp}};
    }
    if (server > 0) sql.w = server;
    console.log('======>>0103:\t', sql);
    stash.startDate = stash.startDate.replace(/-/g, '');
    mongoDB.getGameDBBackUp(stash.platform, stash.version, 'game_user', stash.startDate, function(error, db, coll) {
        if (error) return cb(error);
        utilityFunc.queryLargeDBData(db, coll, sql, {
            w:1, n:1, mid:1, vip:1, 'card.i': 1, 'card.s': 1, 'card.q': 1, 'card.ex': 1
        }, cb, function(value) {
            if(value.card) {
                for(var j=0; j < value.card.length; j++){ 
                    var cardLevel = utilityFunc.getCardLevelByExp(stash.platform, value.card[j].ex);
                    if((starLimit > 0 && starLimit > value.card[j].s) ||
                        (levelLimit > 0 && levelLimit > cardLevel) ||
                        (qualityLimit > 0 && qualityLimit > value.card[j].q))
                        continue;
                    stash.data.push({
                        server  : value.w,
                        mid     : value.mid,
                        wuid    : value._id,
                        name    : value.n,
                        vip     : value.vip[0],
                        itemID  : value.card[j].i,
                        itemCID  : utilityFunc.getHeyueCidById(stash.platform, value.card[j].i),
                        star    : value.card[j].s,
                        quality : value.card[j].q,
                        level   : cardLevel
                    });
                }
            }
        });
    });
};

var queryCoach = function(stash, cb) {
    var server = parseInt(stash.server); 
    var sql = {};
    if(stash.day) {
        var timestamp = utilityFunc.getTimestamp(stash.startDate) - parseInt(stash.day) * 86400; 
        sql = {t: {$gte: timestamp}};
    }
    if (server > 0) sql.w = server;
    console.log('======>>0103:\t', sql);
    stash.startDate = stash.startDate.replace(/-/g, '');
    mongoDB.getGameDBBackUp(stash.platform, stash.version, 'game_user', stash.startDate, function(error, db, coll) {
        if (error) return cb(error);
        utilityFunc.queryLargeDBData(db, coll, sql, {
            w:1, n:1, mid:1, vip:1, 'coach.i':1, 'coach.q':1, 'coach.exp':1
        }, cb, function(value) {
            if(value.coach) {
                for(var j=0; j < value.coach.length; j++){ 
                    stash.data.push({
                        server  : value.w,
                        mid     : value.mid,
                        wuid    : value._id,
                        name    : value.n,
                        vip     : value.vip[0],
                        itemID  : value.coach[j].i,
                        quality : value.coach[j].q,
                        exp     : value.coach[j].exp
                    });
                }
            }
        });
    });
};

var queryEquip = function(stash, cb) {
    var server = parseInt(stash.server); 
    var sql = {};
    if(stash.day) {
        var timestamp = utilityFunc.getTimestamp(stash.startDate) - parseInt(stash.day) * 86400; 
        sql = {t: {$gte: timestamp}};
    }
    if (server > 0) sql.w = server;
    console.log('======>>0103:\t', sql);
    stash.startDate = stash.startDate.replace(/-/g, '');
    mongoDB.getGameDBBackUp(stash.platform, stash.version, 'game_user', stash.startDate, function(error, db, coll) {
        if (error) return cb(error);
        utilityFunc.queryLargeDBData(db, coll, sql, {
            w:1, mid:1, n:1, vip:1, 'item.i':1, 'item.lv':1, 'item.s':1
        }, cb, function(value) {
            if(value.item) {
                for(var j=0; j < value.item.length; j++){ 
                    stash.data.push({
                        server  : value.w,
                        mid     : value.mid,
                        wuid    : value._id,
                        name    : value.n,
                        vip     : value.vip[0],
                        itemID  : value.item[j].i,
                        level   : value.item[j].lv,
                        pos     : value.item[j].s
                    });
                }
            }
        });
    });
};

var queryEmail = function(stash, cb) {
    if (!stash.btn || stash.btn != 'email') return cb(null);

    var options = {
        to: stash.email,
        subject: stash.title,
    };
    if (stash.ope == '1') {
        queryCard(stash, function(error, doc) {
            if(!error) {
                var buff = utilityFunc.dataToCSVFormate(stash.data);
                var fileName = utilityFunc.getTempFileName('card','.csv');
                console.log('====>fileName: ', fileName);
                fs.writeFile(fileName, buff, function (err) {
                    if (err) {
                        console.log(err);
                        options.text = '卡牌查询内部错误，请稍后重试';
                        mail.sendMail(options, function(){});
                    } else {
                        options.text = '卡牌查询，详细数据见附件';
                        options.attachments = [{
                            filename: '卡牌统计数据.csv',
                            path: fileName
                        }];
                        console.log('====>sending...');
                        mail.sendMail(options, function(err){
                            //发送失败后保留文件
                            if(!err) {
                                spawn('rm', ['-rf', fileName.toString()]);
                            }
                        });
                    }
                });
            }
            else {
                options.text = '卡牌查询出错，请检查输入并重试';
                console.log('====>sending...');
                mail.sendMail(options, function(){});
            }
        });
    } else if (stash.ope == '2') {
        queryCoach(stash, function(error, doc) {
            if(!error) {
                var buff = utilityFunc.dataToCSVFormate(stash.data);
                var fileName = utilityFunc.getTempFileName('coach','.csv');
                console.log('====>fileName: ', fileName);
                fs.writeFile(fileName, buff, function (err) {
                    if (err) {
                        options.text = '教练查询内部错误，请稍后重试';
                        mail.sendMail(options, function(){});
                    } else {
                        options.text = '教练查询，详细数据见附件';
                        options.attachments = [{
                            filename: '教练统计数据.csv',
                            path: fileName
                        }];
                        console.log('====>sending...');
                        mail.sendMail(options, function(err){
                            //发送失败后保留文件
                            if(!err) {
                                spawn('rm', ['-rf', fileName.toString()]);
                            }
                        });
                    }
                });
            }
            else {
                options.text = '教练查询出错，请检查输入并重试';
                console.log('====>sending...');
                mail.sendMail(options, function(){});
            }
        });
    } else if (stash.ope == '3') {
        queryEquip(stash, function(error, doc) {
            if(!error) {
                var buff = utilityFunc.dataToCSVFormate(stash.data);
                var fileName = utilityFunc.getTempFileName('equip','.csv');
                console.log('====>fileName: ', fileName);
                fs.writeFile(fileName, buff, function (err) {
                    if (err) {
                        options.text = '装备查询内部错误，请稍后重试';
                        mail.sendMail(options, function(){});
                    } else {
                        options.text = '装备查询，详细数据见附件';
                        options.attachments = [{
                            filename: '装备统计数据.csv',
                            path: fileName
                        }];
                        console.log('====>sending...');
                        mail.sendMail(options, function(err){
                            //发送失败后保留文件
                            if(!err) {
                                spawn('rm', ['-rf', fileName.toString()]);
                            }
                        });
                    }
                });
            }
            else {
                options.text = '装备查询出错，请检查输入并重试';
                console.log('====>sending...');
                mail.sendMail(options, function(){});
            }
        });
    } else {
        return cb('invalid');
    }
    return cb('email');
};
