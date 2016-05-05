var fs = require('fs');
var async = require('async');
var mongoDB = require('../models/db');
var mongoLong = require('mongodb').Long;
var utilityFunc = require('../models/UtilityFunction');

var handler = module.exports;

handler.simplifiedfilePath = '/data/nba2/report/simplified/';
handler.traditionalFilePath = '/data/nba2/report/traditional/';
handler.dayDiamondAddFileName = 'day_diamond_add';
handler.dayDiamondDelFileName = 'day_diamond_del';
handler.dayCoinAddFileName = 'day_coin_add';
handler.dayCoinDelFileName = 'day_coin_del';
handler.dayMatchFileName = 'day_match';
handler.dayLegendRemainFileName = 'day_legend_remain';
handler.dayLegendEnterFileName = 'day_legend_enter';
handler.dayDetailMoneyAddFileName = 'day_person_money_add';
handler.dayDetailMoneyDelFileName = 'day_person_money_del';

handler.getFileName = function(dateTime, fileName, path) {
    var newDateTime = dateTime.toString().replace(/-/g, '');
    return path.toString() + fileName + newDateTime + ".csv";
};

handler.checkFile = function(platform, lastDate, fileName, callback) {
    var pathName = '';
    if (platform == 1) pathName = this.simplifiedfilePath;
    else pathName = this.traditionalFilePath;
    var fileFullName = this.getFileName(lastDate, fileName, pathName);
    fs.stat(fileFullName, function (err, stats) {
        if (err && err.code == 'ENOENT') {
            callback(platform, lastDate, fileFullName, function(){});
        }
    });
};

function genDayAdd(platform, lastDate, fileFullName, id, callback) {
    console.log('=========>>>test0103:\t', platform, lastDate, fileFullName, id);
    var stream = fs.WriteStream(fileFullName);  
    var startTime = utilityFunc.getTimestamp(lastDate);
    var endTime = startTime + 86400;
    var servers = [];
    var datas = [];
    var start = 0;
    var _sql = {f0 : 103, f1: {$gte: startTime, $lt: endTime}, "f5.i" : id};
    if (platform == 1) {
        servers = utilityFunc.getCNConfig(); 
    }
    else {
        servers = utilityFunc.getTWConfig(); 
    }
    console.log('=========>>>test0104:\t', _sql);
    async.whilst(
        function(){ return start < servers.length; },
        function(callback1){
            mongoDB.getNBA2OpeDB(platform, servers[start].i, function(error, db, coll) {
                if (error) {
                    ++start;
                    return callback1(error);
                }
                coll.find(_sql).toArray(function(error, doc) {
                    var userData = {};
 //                   console.log('=========>>>test0105:\t');
                    doc.forEach(function(elem) {
                        for (var i in elem.f5) {
                            if(elem.f5[i].i == id) {
//                                console.log('=========>>>test0106:\t', elem.f5[i]);
                                if(userData[elem.f2]) { //{action, count}
                                    userData[elem.f2].push({a : elem.f3, c : elem.f4 * elem.f5[i].a});
                                } else {
                                    userData[elem.f2] = [{a : elem.f3, c : elem.f4 * elem.f5[i].a}];
                                }
                            } 
                        }
                    });
                    var result = {};
                    var temp = {};
                    var key, data;
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
                    var emptyFlag = true;
                    for(key in result) {
                        data = servers[start].i+','+lastDate+','+key+','+result[key].n+','+result[key].c+'\n'; 
                        stream.write(data);
                        emptyFlag = false;
                        datas.push({
                            server : servers[start].i,
                            date   : lastDate,
                            action : utilityFunc.getActionName(key),
                            count  : result[key].n,
                            total  : result[key].c
                        });
                    }
                    if(emptyFlag) {
                        data = servers[start].i+','+lastDate+',0,0,0'+'\n'; 
                        stream.write(data);
                        datas.push({
                            server : servers[start].i,
                            date   : lastDate,
                            action : 0,
                            count  : 0,
                            total  : 0
                        });
                    }

                    ++start;
                    db.close();
                    return callback1(null);
                });
            });
        },
        function(error){
                console.log('=========>>>test0110:\t', error, fileFullName, datas);
                return callback(error, datas);
        }
    );
}

function genDayDel(platform, lastDate, fileFullName, id, callback) {
    var stream = fs.WriteStream(fileFullName);  
    var startTime = utilityFunc.getTimestamp(lastDate); 
    var endTime = startTime + 86400;
    var servers = [];
    var datas = [];
    var start = 0;
    var _sql = {f0 : 101, f1: {$gte: startTime, $lt: endTime}, "f4.i" : id};
    if (platform == 1) {
        servers = utilityFunc.getCNConfig(); 
    }
    else {
        servers = utilityFunc.getTWConfig(); 
    }
    async.whilst(
        function(){ return start < servers.length; },
        function(callback1){
            mongoDB.getNBA2OpeDB(platform, servers[start].i, function(error, db, coll) {
                if (error) {
                    ++start;
                    return callback1(error);
                }
                coll.find(_sql).toArray(function(error, doc) {
                    var userData = {};
                    console.log('=========>>>test0105:\t');
                    doc.forEach(function(elem) {
                        for (var i in elem.f4) {
                            if(elem.f4[i].i == id) {
                                if(userData[elem.f2]) { //{action, count}
                                    userData[elem.f2].push({a : elem.f3, c : elem.f4[i].a});
                                } else {
                                    userData[elem.f2] = [{a : elem.f3, c : elem.f4[i].a}];
                                }
                            } 
                        }
                    });
                    var result = {};
                    var temp = {};
                    var key, data;
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
                    var emptyFlag = true;
                    for(key in result) {
                        data = servers[start].i+','+lastDate+','+key+','+result[key].n+','+result[key].c+'\n'; 
                        stream.write(data);
                        emptyFlag = false;
                        datas.push({
                            server : servers[start].i,
                            date   : lastDate,
                            action : utilityFunc.getActionName(key),
                            count  : result[key].n,
                            total  : result[key].c
                        });
                    }
                    if(emptyFlag) {
                        data = servers[start].i+','+lastDate+',0,0,0'+'\n'; 
                        stream.write(data);
                        datas.push({
                            server : servers[start].i,
                            date   : lastDate,
                            action : 0,
                            count  : 0,
                            total  : 0
                        });
                    }

                    ++start;
                    db.close();
                    callback1(null);
                });
            });
        },
        function(error){
            console.log('=========>>>test0110:\t', error, fileFullName, datas);
            return callback(error, datas);
        }
    );
}

function genPersonDayMoneyAdd(platform, lastDate, fileFullName, id, callback, server) {
    console.log('=========>>>test0103:\t', platform, lastDate, fileFullName, id);
    var stream = fs.WriteStream(fileFullName);  
    var startTime = utilityFunc.getTimestamp(lastDate);
    var endTime = startTime + 86400;
    var servers = [];
    var datas = [];
    var start = 0;
    var _sql = {f0 : 103, f1: {$gte: startTime, $lt: endTime}, "f5.i" : id};
    if (platform == 1) {
        servers = utilityFunc.getCNConfig(); 
    } else {
        servers = utilityFunc.getTWConfig(); 
    }
    console.log('=========>>>test0104:\t', _sql);
    async.whilst(
        function(){ return start < servers.length; },
        function(callback1){
            mongoDB.getNBA2OpeDB(platform, servers[start].i, function(error, db, coll) {
                if (error) {
                    ++start;
                    return callback1(error);
                }
                coll.aggregate([
                        {$match: _sql}, 
                        {$unwind: '$f5'}, 
                        {$match: {'f5.i': id}}, 
                        {$project: {money: {$multiply: ['$f4', '$f5.a']}, 'f2': 1}},
                        {$group: {_id: '$f2', total: {$sum: '$money'}}}
                ], function(error, values){
                    if(error) {
                        db.close();
                        return callback1(error);
                    }
                    var results = [];
                    var i;
                    for (i = 0; i < values.length; ++i) {
                        results.push({
                            server : servers[start].i,
                            date   : lastDate,
                            wuid   : values[i]._id,
                            count  : values[i].total
                        });
                    }
                    results.sort(function(item1, item2) { return item2.count - item1.count;});
                    for (i = 0; i < results.length; ++i) {
                        var data = servers[start].i+','+lastDate+','+results[i].wuid+','+results[i].count+'\n'; 
                        stream.write(data);
                    }
                    if(servers[start].i == server) datas = results;
                    ++start;
                    db.close();
                    return callback1(null);
                });
            });
        },
        function(error){
            console.log('=========>>>test0110:\t', error);
            return callback(error, datas);
        }
    );
}

function genPersonDayMoneyDel(platform, lastDate, fileFullName, id, callback, server) {
    var stream = fs.WriteStream(fileFullName);  
    var startTime = utilityFunc.getTimestamp(lastDate); 
    var endTime = startTime + 86400;
    var datas = [], servers = [];
    var start = 0;
    var _sql = {f0 : 101, f1: {$gte: startTime, $lt: endTime}, "f4.i" : id};
    if (platform == 1) {
        servers = utilityFunc.getCNConfig(); 
    } else {
        servers = utilityFunc.getTWConfig(); 
    }
    async.whilst(
        function(){ return start < servers.length; },
        function(callback1){
            mongoDB.getNBA2OpeDB(platform, servers[start].i, function(error, db, coll) {
                if (error) {
                    ++start;
                    return callback1(error);
                }
                coll.aggregate([
                        {$match: _sql}, 
                        {$unwind: '$f4'}, 
                        {$match: {'f4.i': id}}, 
                        {$group: {_id: '$f2', total: {$sum: '$f4.a'}}}
                ], function(error, values){
                    if(error) {
                        db.close();
                        return callback1(error);
                    }
                    var results = [];
                    var i;
                    for (i = 0; i < values.length; ++i) {
                        results.push({
                            server : servers[start].i,
                            date   : lastDate,
                            wuid   : values[i]._id,
                            count  : values[i].total
                        });
                    }
                    results.sort(function(item1, item2) { return item2.count - item1.count;});
                    for (i = 0; i < results.length; ++i) {
                        var data = servers[start].i+','+lastDate+','+results[i].wuid+','+results[i].count+'\n'; 
                        stream.write(data);
                    }
                    if(servers[start].i == server) datas = results;
                    ++start;
                    db.close();
                    return callback1(null);
                });
            });
        },
        function(error){
            console.log('=========>>>test0110:\t', error);
            return callback(error, datas);
        }
    );
}

handler.genDayDiamondAdd = function(platform, lastDate, fileFullName, callback) {
    genDayAdd(platform, lastDate, fileFullName, 20003, callback);
};

handler.genDayDiamondDel = function(platform, lastDate, fileFullName, callback) {
    genDayDel(platform, lastDate, fileFullName, 20003, callback);
};

handler.genDayCoinAdd = function(platform, lastDate, fileFullName, callback) {
    genDayAdd(platform, lastDate, fileFullName, 20002, callback);
};

handler.genDayCoinDel = function(platform, lastDate, fileFullName, callback) {
    genDayDel(platform, lastDate, fileFullName, 20002, callback);
};

handler.genDetailDayMoneyAdd = function(platform, lastDate, fileFullName, callback, server) {
    genPersonDayMoneyAdd(platform, lastDate, fileFullName, 20003, callback, server);
};

handler.genDetailDayMoneyDel = function(platform, lastDate, fileFullName, callback, server) {
    genPersonDayMoneyDel(platform, lastDate, fileFullName, 20003, callback, server);
};

handler.genDayMatch = function(platform, lastDate, fileFullName, callback) {
    var stream = fs.WriteStream(fileFullName);  
    var startTime = utilityFunc.getTimestamp(lastDate); 
    var endTime = startTime + 86400;
    var servers = [];
    var datas = [];
    var start = 0;
    var _sql = {
        $or : [
            {f0 : 104, f3 : {$in: [120,124]}},
            {f0 : 111, f3 : {$in: [160,161]}},
            {f0 : 130, f3 : 313}
        ], 
        f1: {$gte: startTime, $lt: endTime}
    };
    if (platform == 1) {
        servers = utilityFunc.getCNConfig(); 
    }
    else {
        servers = utilityFunc.getTWConfig(); 
    }
    var i;
    for (i = 0; i < 3; ++i) {
        datas[i] = [];
    }
    async.whilst(
        function(){ return start < servers.length; },
        function(callback1){
            mongoDB.getNBA2OpeDB(platform, servers[start].i, function(error, db, coll) {
                if (error) {
                    ++start;
                    return callback1(error);
                }
                coll.find(_sql).toArray(function(error, doc) {
                    var userData = [];
                    var userCount = [];
                    var matchCount = [];
                    for (var i = 0; i < 3; ++i) {
                        userData[i] = {};
                        userCount[i] = 0;
                        matchCount[i] = 0;
                    }
                    console.log('=========>>>test0105:\t');
                    doc.forEach(function(elem) {
                        if(elem.f0 == 104) {
                            var count = (elem.f3 == 124) ? elem.f4.c : 1;
                            //var count = (elem.f3 == 124) ? elem.f5 : 1;
                            matchCount[0] += count;
                            if(userData[0][elem.f2]) {
                                userData[0][elem.f2] += count;
                            } else {
                                userData[0][elem.f2] = count;
                                ++userCount[0];
                            }
                        } else if (elem.f0 == 111) {
                            matchCount[1] += 1;
                            if(userData[1][elem.f2]) {
                                userData[1][elem.f2] += 1;
                            } else {
                                userData[1][elem.f2] = 1;
                                ++userCount[1];
                            }
                        } else {
                            matchCount[2] += 1;
                            if(userData[2][elem.f2]) {
                                userData[2][elem.f2] += 1;
                            } else {
                                userData[2][elem.f2] = 1;
                                ++userCount[2];
                            }
                        }
                    });
                    for (i = 0; i < 3; ++i) {
                        var data = (i+1)+','+servers[start].i+','+lastDate+','+userCount[i]+','+matchCount[i]+'\n'; 
                        stream.write(data);
                        datas[i].push({
                            server      : servers[start].i,
                            date        : lastDate,
                            playerCount : userCount[i],
                            matchCount  : matchCount[i]
                        });
                    }

                    ++start;
                    db.close();
                    callback1(null);
                });
            });
        },
        function(error){
            console.log('=========>>>test0110:\t', error, datas);
            return callback(error, datas);
        }
    );
};

handler.genDayLegendRemain = function(platform, lastDate, fileFullName, callback) {
    var remainDay = 5; //流失天数定义为5天
    var config = utilityFunc.getLegendConfig(platform);
    var stream = fs.WriteStream(fileFullName);  
    var dayTime = utilityFunc.getTimestamp(lastDate); 
    var startTime = dayTime - remainDay * 86400;  
    var endTime = dayTime + 86400;
    var servers = [];
    var datas = [];
    var start = 0;
    if (platform == 1) {
        servers = utilityFunc.getCNConfig(); 
    }
    else {
        servers = utilityFunc.getTWConfig(); 
    }
    async.whilst(
        function(){ return start < servers.length; },
        function(callback1){
            var missUsers = {};
            var remainUsers = {};
            async.series({
                one: function(callback2) {
                    var _sql = {f0 : 109, f1: {$gte: startTime, $lt: endTime}, f3: 243};
                    mongoDB.getNBA2OpeDB(platform, servers[start].i, function(error, db, coll) {
                        if (error) {
                            ++start;
                            return callback2(error);
                        }
                        coll.find(_sql, {fields:{f1:1, f2:1}}).toArray(function(error, doc) {
                            var users = {};
                            doc.forEach(function(elem) {
                                var dateTime = utilityFunc.getDateTime(elem.f1);
                                if(users[elem.f2]) {
                                    if(!users[elem.f2][dateTime]) {
                                        users[elem.f2][dateTime] = elem.f1;
                                    }
                                } else {
                                    var temp = {};
                                    temp[dateTime] = elem.f1;
                                    users[elem.f2] = temp;
                                }
                            });
                            var startDate = utilityFunc.getDateTime(startTime);
                            var endDate = utilityFunc.getDateTime(dayTime);
                            //console.log('=========>>>test0105:\t', startDate,endDate, users);
                            for(var key in users) {
                                //流失玩家的先决条件
                                if(users[key][startDate]){
                                    var flag = false;
                                    for(var key1 in users[key]){
                                        if(key1 != startDate) {
                                            flag = true;
                                            break;
                                        }
                                    }
                                    if(flag) remainUsers[key] = 10011;
                                    else missUsers[key] = 10011;
                                } else {
                                    remainUsers[key] = 10011;
                                }
                            }
                            db.close();
                            callback2(null);
                        });
                    });
                },
                two: function(callback2) {
                    //只查询普通主线赛
                    var _sql = {f0 : 104, f3 : 120, f1: {$gte: startTime, $lt: endTime}, 'f4.g' : {$gte: 10000, $lt: 20000}};
                    //var _sql = {f0 : 104, f3 : 120, f1: {$gte: startTime, $lt: endTime}, f4 : {$gte: 10000, $lt: 20000}};
                    mongoDB.getNBA2OpeDB(platform, servers[start].i, function(error, db, coll) {
                        if (error) {
                            ++start;
                            return callback2(error);
                        }
                        coll.find(_sql).toArray(function(error, doc) {
                            console.log('=========>>>test0105:\t');
                            doc.forEach(function(elem) {
                                var id = elem.f4.g;
                                //var id = elem.f4;
                                if(missUsers[elem.f2] && missUsers[elem.f2] < id) {
                                    missUsers[elem.f2] = id;
                                } else if(remainUsers[elem.f2] && remainUsers[elem.f2] < id) {
                                    remainUsers[elem.f2] = id;
                                }
                            });
                            var result = {};
                            var key, id, data, chapter;
                            for(key in missUsers) {
                                id = missUsers[key];
                                if(result[id]) result[id].mc += 1;
                                else result[id] = {mc : 1, rc : 0};
                            }
                            for(key in remainUsers) {
                                id = remainUsers[key];
                                if(result[id]) result[id].rc += 1;
                                else result[id] = {mc : 0, rc : 1};
                            }
                            var emptyFlag = true;
                            for(key in result) {
                                data = servers[start].i+','+lastDate+','+key+','+result[key].mc+','+result[key].rc+'\n'; 
                                stream.write(data);
                                emptyFlag = false;
                                chapter = config[key] ? config[key] : {};
                                datas.push({
                                    server      : servers[start].i,
                                    date        : lastDate,
                                    chapterID   : key,
                                    chapterName : chapter.n,
                                    missCount   : result[key].mc,
                                    remainCount : result[key].rc,
                                });
                            }
                            if(emptyFlag) {
                                data = servers[start].i+','+lastDate+','+10011+',0,0'+'\n'; 
                                stream.write(data);
                                chapter = config[10011] ? config[10011] : {};
                                datas.push({
                                    server      : servers[start].i,
                                    date        : lastDate,
                                    chapterID   : 10011,
                                    chapterName : chapter.n,
                                    missCount   : 0,
                                    remainCount : 0,
                                });
                            }
                            ++start;
                            db.close();
                            callback2(null);
                        });
                    });
                }
            }, function(error, doc) {
                return callback1(error);
            });
        }, function(error){
            console.log('=========>>>test0110:\t', error, datas);
            return callback(error, datas);
        }
    );
};

handler.genDayLegendEnter = function(platform, lastDate, fileFullName, callback) {
    var config = utilityFunc.getLegendConfig(platform);
    var stream = fs.WriteStream(fileFullName);  
    var startTime = utilityFunc.getTimestamp(lastDate); 
    var endTime = startTime + 86400;
    var servers = [];
    var datas = [];
    var start = 0;
    var _sql = {f0 : 104, f3 : {$in: [120,124]}, f1: {$gte: startTime, $lt: endTime}};
    if (platform == 1) {
        servers = utilityFunc.getCNConfig(); 
    }
    else {
        servers = utilityFunc.getTWConfig(); 
    }
    async.whilst(
        function(){ return start < servers.length; },
        function(callback1){
            mongoDB.getNBA2OpeDB(platform, servers[start].i, function(error, db, coll) {
                if (error) {
                    ++start;
                    return callback1(error);
                }
                coll.find(_sql).toArray(function(error, doc) {
                    console.log('=========>>>test0105:\t');
                    var result = {};
                    doc.forEach(function(elem) {
                        var id = elem.f4.g;
                        var count = (elem.f3 == 124) ? elem.f4.c : 1;
                        //var id = elem.f4;
                        //var count = (elem.f3 == 124) ? elem.f5 : 1;
                        if(result[id]) {
                            result[id] += count;
                        } else {
                            result[id] = count;
                        }
                    });
                    var emptyFlag = true;
                    var key, data, chapter;
                    for(key in result) {
                        data = servers[start].i+','+lastDate+','+key+','+result[key]+'\n'; 
                        stream.write(data);
                        emptyFlag = false;
                        chapter = config[key] ? config[key] : {};
                        datas.push({
                            server      : servers[start].i,
                            date        : lastDate,
                            chapterID   : key,
                            type        : chapter.t,
                            chapterName : chapter.n,
                            count       : result[key],
                        });
                    }
                    if(emptyFlag) {
                        data = servers[start].i+','+lastDate+',10011,0'+'\n'; 
                        stream.write(data);
                        chapter = config[10011] ? config[10011] : {};
                        datas.push({
                            server      : servers[start].i,
                            date        : lastDate,
                            chapterID   : 10011,
                            type        : chapter.t,
                            chapterName : chapter.n,
                            count       : 0,
                        });
                    }

                    ++start;
                    db.close();
                    callback1(null);
                });
            });
        },
        function(error){
            console.log('=========>>>test0110:\t', error, datas);
            return callback(error, datas);
        }
    );
};

handler.check = function() {
    var lastDate = utilityFunc.getYesterdayDate(0);
    //simplified
    if(utilityFunc.area & 1) {
        if(utilityFunc.checkAndCreateDir(this.simplifiedfilePath)) {
            this.checkFile(1, lastDate, this.dayDiamondAddFileName, this.genDayDiamondAdd);
            this.checkFile(1, lastDate, this.dayDiamondDelFileName, this.genDayDiamondDel);
            this.checkFile(1, lastDate, this.dayCoinAddFileName, this.genDayCoinAdd);
            this.checkFile(1, lastDate, this.dayCoinDelFileName, this.genDayCoinDel);
            this.checkFile(1, lastDate, this.dayMatchFileName, this.genDayMatch);
            this.checkFile(1, lastDate, this.dayLegendRemainFileName, this.genDayLegendRemain);
            this.checkFile(1, lastDate, this.dayLegendEnterFileName, this.genDayLegendEnter);
            this.checkFile(1, lastDate, this.dayDetailMoneyAddFileName, this.genDetailDayMoneyAdd);
            this.checkFile(1, lastDate, this.dayDetailMoneyDelFileName, this.genDetailDayMoneyDel);
        }
    }
    //traditional
    if(utilityFunc.area & 2) {
        if(utilityFunc.checkAndCreateDir(this.simplifiedfilePath)) {
            this.checkFile(2, lastDate, this.dayDiamondAddFileName, this.genDayDiamondAdd);
            this.checkFile(2, lastDate, this.dayDiamondDelFileName, this.genDayDiamondDel);
            this.checkFile(2, lastDate, this.dayCoinAddFileName, this.genDayCoinAdd);
            this.checkFile(2, lastDate, this.dayCoinDelFileName, this.genDayCoinDel);
            this.checkFile(2, lastDate, this.dayMatchFileName, this.genDayMatch);
            this.checkFile(2, lastDate, this.dayLegendRemainFileName, this.genDayLegendRemain);
            this.checkFile(2, lastDate, this.dayLegendEnterFileName, this.genDayLegendEnter);
            this.checkFile(2, lastDate, this.dayDetailMoneyAddFileName, this.genDetailDayMoneyAdd);
            this.checkFile(2, lastDate, this.dayDetailMoneyDelFileName, this.genDetailDayMoneyDel);
        }
    }
};

