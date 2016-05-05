var handler = module.exports;

var fs = require('fs');
var async = require('async');
var spawn = require('child_process').spawn;
var mongoLong = require('mongodb').Long;
var mail = require('../models/mail');
var mongoDB = require('../models/db');
var utilityFunc = require('../models/UtilityFunction');

handler.index = function(req, res) {
    var stash = req.body;
    stash.title = "统计钻石产出与消耗";
    stash.area = utilityFunc.area;
    console.log('=========>>>0101:\t', stash);
    stash.servers = utilityFunc.getAllServers();

    async.series({
        checkParam: function(callback) {    
            stash.data = [];
            if(stash.btn && stash.btn != 'query') stash.data.push(['区服','查询日期','操作','人数','总额']);
            return callback(null);    
        },
        queryEmail: function(callback) {
            return queryEmail(stash, callback);
        },
        queryBase: function(callback) {
            if (stash.ope == '1') {
                queryAdd(stash, function(error, doc) {
                    return callback(error);
                });
            } else if ( stash.ope == '2') {
                queryDel(stash, function(error, doc) {
                    return callback(error);
                });
            } else {
                return callback(null);
            }
        },
        downloadBase: function(callback) {
            if (!stash.btn || stash.btn != 'download') return callback(null);
            utilityFunc.downloadCSV(res, stash.data, 'statisticMoney.csv');
            return callback(null);
        }
    }, function(error, doc) {
        if(error) stash.error = utilityFunc.getErrMsg(error); 
        //console.log('==========>>>0102:\t', stash);
        if (!stash.btn || stash.btn != 'download') {
            res.render('statisticMoney', {stash: stash});
        }
    });
};

var queryAdd = function(stash, cb) {
    var server = parseInt(stash.server);
    var userSql = {};
    if(stash.subID) {
        var vips = stash.subID.split('-');
        if(vips.length !== 2) return cb('invalid');
        var minVip = parseInt(vips[0]);
        var maxVip = parseInt(vips[1]);
        if(isNaN(minVip) && isNaN(maxVip)) return cb('invalid');
        userSql['vip.0'] = {};
        if(!!minVip) userSql['vip.0'].$gte = minVip;
        if(!!maxVip) userSql['vip.0'].$lte = maxVip;
        if(server > 0) userSql.w = server;
    }
    var startTime = utilityFunc.getTimestamp(stash.startDate);
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86400;
    stash.startDate = stash.startDate.replace(/-/g, '');
    stash.endDate = stash.endDate.replace(/-/g, '');
    var date = stash.startDate + '-' + stash.endDate;
    var _sql = {f0 : 103, f1: {$gte: startTime, $lt: endTime}, "f5.i" : 20003};
    var servers = [];
    if (server > 0) servers = [{i: server}];
    else if (stash.platform == 1 && server == -2) {
        servers = utilityFunc.getCNConfig().filter(function(element, index, array) {
            return element.i % 2 == 1;
        });
    } else if (stash.platform == 1 && server == -3){
        servers = utilityFunc.getCNConfig().filter(function(element, index, array) {
            return element.i % 2 === 0;
        });
    } else if (stash.platform == 2) {
        servers = utilityFunc.getTWConfig(); 
    } else {
        return cb('invalid');
    }
    console.log('=========>>>test0104:\t', userSql, _sql);
    var users = {};
    async.series({
        getAllUser: function(callback) {
            stash.endDate = stash.endDate.replace(/-/g, '');
            mongoDB.getGameDBBackUp(stash.platform, stash.version, 'game_user', stash.endDate, function(error, db, coll) {
                if (error) return callback(error);
                coll.find(userSql, {fields:{_id:1}}).toArray(function(error, values) {
                    if(error) {
                        db.close();
                        return callback(error);
                    }
                    console.log('=========>>>vip users count:\t', values.length, vips);
                    for (var i = 0; i < values.length; ++i) {
                        users[values[i]._id] = 1;
                    }
                    db.close();
                    return callback(null);
                });
            });
        },
        statistic: function(callback) {
            var start = 0;
            async.whilst(
                function(){ return start < servers.length; },
                function(callback1){
                    mongoDB.getNBA2OpeDB(stash.platform, servers[start].i, function(error, db, coll) {
                        if (error) return callback1(error);
                        coll.find(_sql).toArray(function(error, doc) {
                            var userData = {};
                            doc.forEach(function(elem) {
                                if(users[elem.f2]) { //符合VIP条件的玩家
                                    for (var i in elem.f5) {
                                        if(elem.f5[i].i == 20003) {
                                            if(userData[elem.f2]) { //{action, count}
                                                userData[elem.f2].push({a : elem.f3, c : elem.f4 * elem.f5[i].a});
                                            } else {
                                                userData[elem.f2] = [{a : elem.f3, c : elem.f4 * elem.f5[i].a}];
                                            }
                                        } 
                                    }
                                }
                            });
                            var result = {};
                            var temp = {};
                            var key;
                            for(key in userData) {
                                for(var i = 0; i < userData[key].length; ++i) {
                                    var action = userData[key][i].a;
                                    var count = userData[key][i].c;
                                    if(result[action]) {
                                        result[action].c += count;
                                        if(!temp[action][key]){
                                            temp[action][key] = count;
                                            ++ result[action].n;
                                        }
                                    } else {
                                        result[action] = {n : 1, c : count};
                                        var temp1 = {};
                                        temp1[key] = count;
                                        temp[action] = temp1;
                                    }
                                }
                            }
                            console.log('=========>>>test0109:\t', result);
                            for(key in result) {
                                stash.data.push({
                                    server : servers[start].i,
                                    date   : date,
                                    action : utilityFunc.getActionName(key),
                                    count  : result[key].n,
                                    total  : result[key].c
                                });
                            }

                            ++start;
                            db.close();
                            return callback1(null);
                        });
                    });
                },
                function(error){
                    console.log('=========>>>test0110:\t', error);
                    return callback(error);
                }
            );
        }
    }, function(error, doc) { 
        if(error) return cb('internal');
        return cb(null);
    });
};

var queryDel = function(stash, cb) {
    var server = parseInt(stash.server);
    var userSql = {};
    if(stash.subID) {
        var vips = stash.subID.split('-');
        if(vips.length !== 2) return cb('invalid');
        var minVip = parseInt(vips[0]);
        var maxVip = parseInt(vips[1]);
        if(isNaN(minVip) && isNaN(maxVip)) return cb('invalid');
        userSql['vip.0'] = {};
        if(!!minVip) userSql['vip.0'].$gte = minVip;
        if(!!maxVip) userSql['vip.0'].$lte = maxVip;
        if(server > 0) userSql.w = server;
    }
    var startTime = utilityFunc.getTimestamp(stash.startDate);
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86400;
    stash.startDate = stash.startDate.replace(/-/g, '');
    stash.endDate = stash.endDate.replace(/-/g, '');
    var _sql = {f0 : 101, f1: {$gte: startTime, $lt: endTime}, "f4.i" : 20003};
    var servers = [];
    if (server > 0) servers = [{i: server}];
    else if (stash.platform == 1 && server == -2) {
        servers = utilityFunc.getCNConfig().filter(function(element, index, array) {
            return element.i % 2 == 1;
        });
    } else if (stash.platform == 1 && server == -3){
        servers = utilityFunc.getCNConfig().filter(function(element, index, array) {
            return element.i % 2 === 0;
        });
    } else if (stash.platform == 2) {
        servers = utilityFunc.getTWConfig(); 
    } else {
        return cb('invalid');
    }
    console.log('=========>>>test0104:\t', userSql, _sql);
    var users = {};
    async.series({
        getAllUser: function(callback) {
            stash.endDate = stash.endDate.replace(/-/g, '');
            mongoDB.getGameDBBackUp(stash.platform, stash.version, 'game_user', stash.endDate, function(error, db, coll) {
                if (error) return callback(error);
                coll.find(userSql, {fields:{_id:1}}).toArray(function(error, values) {
                    if(error) {
                        db.close();
                        return callback(error);
                    }
                    console.log('=========>>>vip users count:\t', values.length, vips);
                    for (var i = 0; i < values.length; ++i) {
                        users[values[i]._id] = 1;
                    }
                    db.close();
                    return callback(null);
                });
            });
        },
        statistic: function(callback) {
            var start = 0;
            async.whilst(
                function(){ return start < servers.length; },
                function(callback1){
                    mongoDB.getNBA2OpeDB(stash.platform, servers[start].i, function(error, db, coll) {
                        if (error) return callback1(error);
                        coll.find(_sql).toArray(function(error, doc) {
                            var userData = {};
                            doc.forEach(function(elem) {
                                if(users[elem.f2]) { //符合VIP条件的玩家
                                    for (var i in elem.f4) {
                                        if(elem.f4[i].i == 20003) {
                                            if(userData[elem.f2]) { //{action, count}
                                                userData[elem.f2].push({a : elem.f3, c : elem.f4[i].a});
                                            } else {
                                                userData[elem.f2] = [{a : elem.f3, c : elem.f4[i].a}];
                                            }
                                        } 
                                    }
                                }
                            });
                            var result = {};
                            var temp = {};
                            var key;
                            for(key in userData) {
                                for(var i = 0; i < userData[key].length; ++i) {
                                    var action = userData[key][i].a;
                                    var count = userData[key][i].c;
                                    if(result[action]) {
                                        result[action].c += count;
                                        if(!temp[action][key]){
                                            temp[action][key] = count;
                                            ++ result[action].n;
                                        }
                                    } else {
                                        result[action] = {n : 1, c : count};
                                        var temp1 = {};
                                        temp1[key] = count;
                                        temp[action] = temp1;
                                    }
                                }
                            }
                            console.log('=========>>>test0109:\t', result);
                            for(key in result) {
                                stash.data.push({
                                    server : servers[start].i,
                                    date   : stash.startDate + '-' + stash.endDate,
                                    action : utilityFunc.getActionName(key),
                                    count  : result[key].n,
                                    total  : result[key].c
                                });
                            }

                            ++start;
                            db.close();
                            return callback1(null);
                        });
                    });
                },
                function(error){
                    console.log('=========>>>test0110:\t', error);
                    return callback(error);
                }
            );
        }
    }, function(error, doc) { 
        if(error) return cb('internal');
        return cb(null);
    });
};

var queryEmail = function(stash, cb) {
    if (!stash.btn || stash.btn != 'email') return cb(null);
    var options = {
        to: stash.email,
        subject: stash.title,
    };
    if (stash.ope == '1') {
        queryAdd(stash, function(error, doc) {
            if(!error) {
                var buff = utilityFunc.dataToCSVFormate(stash.data);
                var fileName = utilityFunc.getTempFileName('money','.csv');
                console.log('====>fileName: ', fileName);
                fs.writeFile(fileName, buff, function (err) {
                    if (err) {
                        console.log(err);
                        options.text = '钻石产出统计内部错误，请稍后重试';
                        mail.sendMail(options, function(){});
                    } else {
                        options.text = '钻石产出统计，详细数据见附件';
                        options.attachments = [{
                            filename: '钻石产出统计数据.csv',
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
                options.text = '钻石产出统计出错，请检查输入并重试';
                console.log('====>sending...');
                mail.sendMail(options, function(){});
            }
        });
    } else if (stash.ope == '2') {
        queryDel(stash, function(error, doc) {
            if(!error) {
                var buff = utilityFunc.dataToCSVFormate(stash.data);
                var fileName = utilityFunc.getTempFileName('money','.csv');
                console.log('====>fileName: ', fileName);
                fs.writeFile(fileName, buff, function (err) {
                    if (err) {
                        options.text = '钻石消耗统计内部错误，请稍后重试';
                        mail.sendMail(options, function(){});
                    } else {
                        options.text = '钻石消耗统计，详细数据见附件';
                        options.attachments = [{
                            filename: '钻石消耗统计数据.csv',
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
                options.text = '钻石消耗统计出错，请检查输入并重试';
                console.log('====>sending...');
                mail.sendMail(options, function(){});
            }
        });
    } else {
        return cb('invalid');
    }
    return cb('email');
};
