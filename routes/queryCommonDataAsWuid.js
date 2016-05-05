var handler = module.exports;

var async = require('async');
var utilityFunc = require('../models/UtilityFunction');
var mongoDB = require('../models/db');

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = "查询玩家基本信息";
    _stash.area = utilityFunc.area;
    
    console.log('=========>>>0101:\t', _stash);

    _stash.servers = utilityFunc.getAllServers();
    
    async.series({
        checkParam: function(callback) {    
            _stash.data = [];
            return callback(null);    
        },
        queryCommonDataToLog: function(callback) {
            if (_stash.ope == '1') 
                queryMoneyData(_stash, function(error, doc) {
                    return callback(null);
                });
            else if (_stash.ope == '2') 
                queryCardData(_stash, function(error, doc) {
                    return callback(null);
                });
            else if (_stash.ope == '3') 
                queryTicketData(_stash, function(error, doc) {
                    return callback(null);
                });
            else if (_stash.ope == '4') 
                querySegData(_stash, function(error, doc) {
                    return callback(null);
                });
            else 
                return callback(null);
        }
    }, function(error, doc) {
        console.log('==========>>>0102:\t', _stash);
        res.render('queryCommonDataAsWuid', {stash: _stash});
    });
};

var queryMoneyData = function(stash, cb) {
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86000;
    var _sql = {f0: {$in: [101,103,106,110]}, f1: {$gte: utilityFunc.getTimestamp(stash.startDate), $lt: endTime}, f2: stash.wuid}; 
    console.log('=========>>>0103:\t', _sql);
    async.series({
        query: function(callback) {
            mongoDB.getNBA2OpeDB(stash.platform, stash.server, function(error, db, coll) {
                if (error) return callback(error);
                coll.find(_sql).toArray(function(error, doc) {
                    doc.forEach(function(elem) {
                        var i, change;
                        if (101 == elem.f0) {
                            for (i in elem.f4) {
                                if (elem.f4[i].i == 20003) {
                                    console.log('=========>>>0108:\t', elem);
                                    change = '-' + elem.f4[i].a;
                                    stash.data.push({wuid : elem.f2, date: utilityFunc.getDetailTime(elem.f1), action: utilityFunc.getActionName(elem.f3), detail : change});
                                }
                            }
                        } else if(110 == elem.f0) {
                            for (i in elem.f4) {
                                if (elem.f4[i].i == 20003) {
                                    console.log('=========>>>0108:\t', elem);
                                    change = '=' + elem.f4[i].a;
                                    stash.data.push({wuid : elem.f2, date: utilityFunc.getDetailTime(elem.f1), action: utilityFunc.getActionName(elem.f3), detail : change});
                                }
                            }
                        } else {
                            for (i in elem.f5) {
                                if (elem.f5[i].i == 20003) {
                                    console.log('=========>>>0108:\t', elem);
                                    change = '+' + elem.f5[i].a * elem.f4;
                                    stash.data.push({wuid : elem.f2, date: utilityFunc.getDetailTime(elem.f1), action: utilityFunc.getActionName(elem.f3), detail : change});
                                }
                            }
                        }
                    });
                    stash.data.sort(function(item1, item2) { return new Date(item1.date).getTime() - new Date(item2.date).getTime();});
                    db.close();
                    return callback(null);
                });
            });
        }
    }, function(error, doc) {
        console.log('=========>>>0104:\t', error, doc);
        return cb(null);
    });
};

var queryCardData = function(stash, cb) {
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86000;
    var _sql = {f0: {$in: [101,105]}, f1: {$gte: utilityFunc.getTimestamp(stash.startDate), $lt: endTime}, f2: stash.wuid}; 
    console.log('=========>>>0103:\t', _sql);
    async.series({
        query: function(callback) {
            mongoDB.getNBA2OpeDB(stash.platform, stash.server, function(error, db, coll) {
                if (error) return callback(error);
                coll.find(_sql).toArray(function(error, doc) {
                    doc.forEach(function(elem) {
                        var item = elem.f5;
                        if(101 == elem.f0) 
                            item = elem.f4;
                        if(typeof item == 'string')
                            item = JSON.parse(item);
                        var str = '';
                        for (var i in item) {
                            if (item[i].i >= 10000 && item[i].i < 20000) {
                                str += utilityFunc.formateItemData(stash.platform, item[i].i, 1);
                                console.log('=========>>>0109:\t', item[i], str);
                            }
                        }
                        if (str !== '')
                            stash.data.push({wuid : elem.f2, date: utilityFunc.getDetailTime(elem.f1), action: utilityFunc.getActionName(elem.f3), detail : str});
                    });
                    stash.data.sort(function(item1, item2) { return new Date(item1.date).getTime() - new Date(item2.date).getTime();});
                    db.close();
                    return callback(null);
                });
            });
        }
    }, function(error, doc) {
        console.log('=========>>>0104:\t', error, doc);
        return cb(null);
    });
};

var queryTicketData = function(stash, cb) {
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86000;
    var _sql = {f0: {$in: [101,103,106,110]}, f1: {$gte: utilityFunc.getTimestamp(stash.startDate), $lt: endTime}, f2: stash.wuid}; 
    console.log('=========>>>0103:\t', _sql);
    async.series({
        query: function(callback) {
            mongoDB.getNBA2OpeDB(stash.platform, stash.server, function(error, db, coll) {
                if (error) return callback(error);
                coll.find(_sql).toArray(function(error, doc) {
                    doc.forEach(function(elem) {
                        var i,change;
                        if (101 == elem.f0) {
                            for (i in elem.f4) {
                                if (elem.f4[i].i == 20009) {
                                    console.log('=========>>>0108:\t', elem);
                                    change = '-' + elem.f4[i].a;
                                    stash.data.push({wuid : elem.f2, date: utilityFunc.getDetailTime(elem.f1), action: utilityFunc.getActionName(elem.f3), detail : change});
                                }
                            }
                        } else if(110 == elem.f0) {
                            for (i in elem.f4) {
                                if (elem.f4[i].i == 20009) {
                                    console.log('=========>>>0108:\t', elem);
                                    change = '=' + elem.f4[i].a;
                                    stash.data.push({wuid : elem.f2, date: utilityFunc.getDetailTime(elem.f1), action: utilityFunc.getActionName(elem.f3), detail : change});
                                }
                            }
                        } else {
                            for (i in elem.f5) {
                                if (elem.f5[i].i == 20009) {
                                    console.log('=========>>>0108:\t', elem);
                                    change = '+' + elem.f5[i].a * elem.f4;
                                    stash.data.push({wuid : elem.f2, date: utilityFunc.getDetailTime(elem.f1), action: utilityFunc.getActionName(elem.f3), detail : change});
                                }
                            }
                        }
                    });
                    stash.data.sort(function(item1, item2) { return new Date(item1.date).getTime() - new Date(item2.date).getTime();});
                    db.close();
                    return callback(null);
                });
            });
        }
    }, function(error, doc) {
        console.log('=========>>>0104:\t', error, doc);
        return cb(null);
    });
};
var querySegData = function(stash, cb) {
    var endTime = utilityFunc.getTimestamp(stash.endDate) + 86000;
    var _sql = {f0: {$in: [101,103,106,110]}, f1: {$gte: utilityFunc.getTimestamp(stash.startDate), $lt: endTime}, f2: stash.wuid}; 
    console.log('=========>>>0103:\t', _sql);
    async.series({
        query: function(callback) {
            mongoDB.getNBA2OpeDB(stash.platform, stash.server, function(error, db, coll) {
                if (error) return callback(error);
                coll.find(_sql).toArray(function(error, doc) {
                    doc.forEach(function(elem) {
                        var item = elem.f5;
                        if(101 == elem.f0 || 110 == elem.f0) 
                            item = elem.f4;
                        var str = '';
                        for (var i in item) {
                            if (item[i].i >= 25000 && item[i].i < 26000) {
                                str += utilityFunc.formateItemData(stash.platform, item[i].i, item[i].a);
                                console.log('=========>>>0109:\t', item[i], str);
                            }
                        }
                        if (str !== '')
                            stash.data.push({wuid : elem.f2, date: utilityFunc.getDetailTime(elem.f1), action: utilityFunc.getActionName(elem.f3), detail : str});
                    });
                    stash.data.sort(function(item1, item2) { return new Date(item1.date).getTime() - new Date(item2.date).getTime();});
                    db.close();
                    return callback(null);
                });
            });
        }
    }, function(error, doc) {
        console.log('=========>>>0104:\t', error, doc);
        return cb(null);
    });
};
