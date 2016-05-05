var fs = require('fs');
var Iconv = require('iconv').Iconv;
var mongoLong = require('mongodb').Long;
var async = require('async');

var actionType = require('../config/ActionType').data;
var configCN = require('../../config_data_cn/server_config_CN_PROD').data;
var configTW = require('../../config_data_tw/server_config_TW_PROD').data;
var cardListCN = require('../../config_data_cn/card_list').data;
var cardListTW = require('../../config_data_tw/card_list').data;
var itemListCN = require('../../config_data_cn/item_list').data;
var itemListTW = require('../../config_data_tw/item_list').data;
var equipListCN = require('../../config_data_cn/equip_list').data;
var equipListTW = require('../../config_data_tw/equip_list').data;
var coachListCN = require('../../config_data_cn/coach_list').data;
var coachListTW = require('../../config_data_tw/coach_list').data;
var coachExpCN = require('../../config_data_cn/coach_upgrade').data;
var coachExpTW = require('../../config_data_tw/coach_upgrade').data;
var legendChapterCN = require('../../config_data_cn/pve_legend_guanqia').data;
var legendChapterTW = require('../../config_data_tw/pve_legend_guanqia').data;
var giftPackListCN = require('../../config_data_cn/giftpack_list').data;
var giftPackListTW = require('../../config_data_tw/giftpack_list').data;
var teamExpCN = require('../../config_data_cn/system_team_exp').data;
var teamExpTW = require('../../config_data_tw/system_team_exp').data;
var cardExpCN = require('../../config_data_cn/card_exp_config').data;
var cardExpTW = require('../../config_data_tw/card_exp_config').data;

var iconv = new Iconv('UTF-8', 'GBK//IGNORE');
var MAX_RECORD = 5000;

var handler = module.exports;

handler.area = require('../settings').area;

handler.tempFilePath = '/data/nba2/report/temp/';

handler.getDateTime = function(intime) {
    var _newDate = new Date(intime*1000||Date.now());
    return _newDate.getFullYear()*10000+(_newDate.getMonth()+1)*100+_newDate.getDate();
};

handler.getDetailTime = function(time) {
    var timestamp = new Date(parseInt(time) * 1000 || Date.now());
    var month = timestamp.getMonth() + 1;
    if (month < 10) month = '0'+month;
    var day = timestamp.getDate();
    if (day < 10) day = '0'+day;
    var hour = timestamp.getHours();
    if (hour < 10) hour = '0'+hour;
    var min = timestamp.getMinutes();
    if (min < 10) min = '0'+min;
    var sec = timestamp.getSeconds();
    if (sec < 10) sec = '0'+sec;
    return timestamp.getFullYear() + "-" + month + "-" + day + " " + hour + ":" + min + ":" + sec;
};

handler.getMongoDate = function(intime) {
    var _newDate = new Date((intime*1000||Date.now())-86400000);
    return _newDate.getFullYear()*10000+(_newDate.getMonth()+1)*100+_newDate.getDate();
};

handler.getYesterdayDate = function() {
    var _newDate = new Date(Date.now()-86400000);
    var month = _newDate.getMonth() + 1;
    if (month < 10) month = '0'+month;
    var day = _newDate.getDate();
    if (day < 10) day = '0'+day;
    return _newDate.getFullYear() + '-' + month + '-' + day;
};

handler.getBackUpDate = function(date) {
    date = date.toString();
    if(date.length === 8) date = date.slice(0,4) + '-' + date.slice(4,6)+'-'+date.slice(6,8);
    if(date.length !== 10) return null;
    var msecs = (new Date(date).getTime()) + 86400000;
    var _newDate = new Date(msecs);
    return _newDate.getFullYear()*10000+(_newDate.getMonth()+1)*100+_newDate.getDate();
};

handler.getTimestamp = function(date) {
    if(!date) return parseInt((new Date().getTime())/1000);
    return parseInt(((new Date(date).getTime())/1000)-8*3600);
};

handler.getRegisterDateTime = function(userWuid) {
    if(userWuid === undefined)
        return 0;
    var _userRegisterTimestamp = mongoLong.fromString(userWuid.toString()).getLowBits();
    return handler.getDateTime(_userRegisterTimestamp);
};

handler.getDayFromDate = function(date) {
    var intime = date ? ((new Date(date)).getTime()) : Date.now();
    return (intime+28800000)/86400000 | 0;
};

handler.getDateFromDay = function(day) {
    var _newDate = new Date(day*86400000-28800000 || Date.now());
    return _newDate.getFullYear()*10000+(_newDate.getMonth()+1)*100+_newDate.getDate();
};

handler.getCNConfig = function() {
    var _config = [];
    for (var i in configCN) {
        _config.push({i:configCN[i]._id, n:configCN[i].n.slice(0, configCN[i].n.indexOf('['))});
    }
    return _config;
};

handler.getTWConfig = function() {
    var _config = [];
    for (var i in configTW) {
        _config.push({i:configTW[i]._id, n:configTW[i].n});
    }
    return _config;
};

handler.getAllServers = function() {
    var servers = [];
    var i;
    if(this.area & 1) {
        for (i in configCN) {
            servers.push({i:configCN[i]._id, n:configCN[i].n});
        }
    }
    if(this.area & 2) {
        for (i in configTW) {
            servers.push({i:configTW[i]._id, n:configTW[i].n});
        }
    }
    return servers;
};

handler.getTeamLevelByExp = function(platform, exp){
    var i;
    if (platform == 1) {
        for (i in teamExpCN) {
            if (exp < teamExpCN[i].limit[0]) return i;
        }
    } else {
        for (i in teamExpTW) {
            if (exp < teamExpTW[i].limit[0]) return i;
        }
    }
    return -1;
};

handler.getTeamExpByLevel = function(platform, level){
    if (platform == 1) {
        if(level > teamExpCN.length) return teamExpCN[teamExpCN.length-1].limit[0];
        return teamExpCN[level - 1].limit[0];
    } else {
        if(level > teamExpTW.length) return teamExpTW[teamExpTW.length-1].limit[0];
        return teamExpTW[level - 1].limit[0];
    }
    return -1;
};

handler.getCardLevelByExp = function(platform, exp){
    var i;
    if (platform == 1) {
        for (i in cardExpCN) {
            if (exp < cardExpCN[i].exp) return i;
        }
    } else {
        for (i in cardExpTW) {
            if (exp < cardExpTW[i].exp) return i;
        }
    }
    return -1;
};

handler.getCoachLevelByExp = function(platform, exp){
    var i;
    if (platform == 1) {
        for (i in coachExpCN) {
            if (exp < coachExpCN[i].exp) return coachExpCN[i].lv - 1;
        }
    } else {
        for (i in coachExpTW) {
            if (exp < coachExpTW[i].exp) return coachExpTW[i].lv - 1;
        }
    }
    return -1;
};

handler.getLegendConfig = function(platform) {
    var _config = {};
    var config = legendChapterCN;
    if (platform != 1) config = legendChapterTW;
    for (var i in config) {
        var data = {n : config[i].n, t : config[i].t};
        _config[config[i]._id] = data;
    }
    return _config;
};

handler.getCardName = function(platform, cardID){
    var i;
    if (platform == 1) {
        for (i in cardListCN) {
            if (cardID == cardListCN[i]._id) return cardListCN[i].n;
        }
    } else {
        for (i in cardListTW) {
            if (cardID == cardListTW[i]._id) return cardListTW[i].n;
        }
    }
    return '';
};

//获取合约
handler.getHeyueName = function(platform, cardID){
    var i;
    if (platform == 1) {
        for (i in cardListCN) {
            if (cardID == cardListCN[i].cid) return cardListCN[i].n;
        }
    } else {
        for (i in cardListTW) {
            if (cardID == cardListTW[i].cid) return cardListTW[i].n;
        }
    }
    return '';
};

<<<<<<< HEAD
=======
handler.getHeyueCidById = function(platform, cardID){
    var i;
    if (platform == 1) {
        for (i in cardListCN) {
            if (cardID == cardListCN[i]._id) return cardListCN[i].cid;
        }
    } else {
        for (i in cardListTW) {
            if (cardID == cardListTW[i]._id) return cardListTW[i].cid;
        }
    }
    return '';
};

>>>>>>> bb2757329a80feab7464a92b22768a6afb0bca2b
handler.getCoachName = function(platform, coachID){
    var i;
    if (platform == 1) {
        for (i in coachListCN) {
            if (coachID == coachListCN[i]._id) return coachListCN[i].n;
        }
    } else {
        for (i in coachListTW) { 
            if (coachID == coachListTW[i]._id) return coachListTW[i].n;
        }
    }
    return '';
};

handler.getEquipName = function(platform, equipID){
    var i;
    if (platform == 1) {
        for (i in equipListCN) {
            if (equipID == equipListCN[i]._id) return equipListCN[i].n;
        }
    } else {
        for (i in equipListTW) {
            if (equipID == equipListTW[i]._id) return equipListTW[i].n;
        }
    }
    return '';
};

handler.getGiftPackName = function(platform, gid){
    var i;
    if (platform == 1) {
        for (i in giftPackListCN) {
            if (gid == giftPackListCN[i]._id) return giftPackListCN[i].n;
        }
    } else {
        for (i in giftPackListTW) {
            if (gid == giftPackListTW[i]._id) return giftPackListTW[i].n;
        }
    }
    return '';
};

handler.formateItemsData = function(platform, itemList, multi){
    if (!Array.isArray(itemList)) return null;
    
    var _str = '';
    for (var i in itemList) {
        var num = itemList[i].a;
        if(num === undefined) num = 1;
        if(multi) num = parseInt(num * multi);
        _str += handler.formateItemData(platform, itemList[i].i, num);
    }
    
    return _str;
};

handler.formateItemData = function(platform, itemID, itemNum) {
    var i;
    if(itemNum === undefined) itemNum = 1;
    var simp = (platform == '1');
    if (itemID >= 10000 && itemID < 20000) {
        if (simp) {
            for (i in cardListCN) {
                if (itemID == cardListCN[i]._id) return '['+cardListCN[i]._id+','+cardListCN[i].n+','+itemNum+']';
            }
        } else {
            for (i in cardListTW) {
                if (itemID == cardListTW[i]._id) return '['+cardListTW[i]._id+','+cardListTW[i].n+','+itemNum+']';
            }
        }
    } else if (itemID >= 20000 && itemID < 30000){    
        if (simp) {
            for (i in itemListCN) {
                if (itemID == itemListCN[i]._id) return '['+itemListCN[i]._id+','+itemListCN[i].n+','+itemNum+']';
            }
        } else {
            for (i in itemListTW) {
                if (itemID == itemListTW[i]._id) return '['+itemListTW[i]._id+','+itemListTW[i].n+','+itemNum+']';
            }
        }
    } else if (itemID >= 30000 && itemID < 40000) {
        if (simp) {
            for (i in equipListCN) {
                if (itemID == equipListCN[i]._id) return '['+equipListCN[i]._id+','+equipListCN[i].n+','+itemNum+']';
            }
        } else {
            for (i in equipListTW) {
                if (itemID == equipListTW[i]._id) return '['+equipListTW[i]._id+','+equipListTW[i].n+','+itemNum+']';
            }
        }
    } else if (itemID >= 40000 && itemID < 50000) {
        if (simp) {
            for (i in coachListCN) {
                if (itemID == coachListCN[i]._id) return '['+coachListCN[i]._id+','+coachListCN[i].n+','+itemNum+']';
            }
        } else {
            for (i in itemListTW) {
                if (itemID == coachListTW[i]._id) return '['+coachListTW[i]._id+','+coachListTW[i].n+','+itemNum+']';
            }
        }
    }
    return '['+itemID+',null,'+itemNum+']';
};

/**
 *\brief 格式化Json数据，提取所有value值到array
 */
var objToValueArray = function(obj) {
    var ret = [];
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            //name|Name或者大数字使用文本格式
            if(((typeof prop == 'string') && prop.match(/[n,N]ame/)) || 
               (/*(typeof obj[prop] == 'number') && */(parseInt(obj[prop]) > 99999999))) {
                obj[prop] = '=\"' + obj[prop] + '\"';
            }
            ret.push(obj[prop]);
        }
    }
    return ret;
};

/**
 * \brief 转换array至CSV格式的string
 */

handler.objToCSVString = function(obj) {
    var ret = '';

    obj.forEach(function(item) {
        if (!(item instanceof Array)) item = objToValueArray(item);
        ret += item.join(',') + '\r\n';
    });

    return ret;
};

handler.dataToCSVFormate = function(data) {
    return iconv.convert(this.objToCSVString(data));
};

handler.downloadCSV = function(res, data, fileName) {
    fileName = fileName || 'export.csv';
    fileName = iconv.convert(fileName).toString('binary');
    res.set('Content-Type', 'text/csv; charset=GBK');
    res.set("content-disposition", "attachment; filename=" + fileName);
    res.end(iconv.convert(this.objToCSVString(data)));
};

handler.checkAndCreateDir = function(dirName) {
    return (fs.existsSync(dirName)) || (fs.mkdirSync(dirName));
};

handler.genDownloadFileName = function(name, server, version) {
    var fileName = version ? ((version == 1) ? 'android-' : 'ios-') : '';
    fileName += (parseInt(server) > 0) ? server+'-' : 'all-'; 
    fileName += name;
    return fileName;
};

handler.getActionName = function(action) {
    //console.log('========>>0304:\t', actionType);
    var _actionName = actionType[parseInt(action)];
    if (_actionName) return _actionName;
    return "null";
};

var errInfo = {
    'invalid'  : '输入参数有误，请检查后重试！',
    'internal' : '查询失败，请重试，或者联系Jeffrey！',
    'email'    : '请求已收到，我们将尽快以邮件回复您，请注意查收！',
};

handler.getErrMsg = function(errCode) {
    var errMsg = errInfo[errCode];
    if(!errMsg) errMsg = errCode;
    return errMsg;
};

handler.version = {
    'android'   : 1,
    'ios'       : 2,
};

handler.getTempFileName = function(prefix, postfix) {
    return this.tempFilePath + prefix + this.getTimestamp() + postfix;
};

//用于大量DB数据分批查询
handler.queryLargeDBData = function(db, coll, sql, field, cb, func) {
    if(!db || !coll) return cb('invalid');
    coll.count(sql, function(error, total) {
        console.log('==>>queryLargeDBData:\t', error, total);
        if(error) {
            db.close();
            return cb(error);
        }
        var start = 0;
        async.whilst(
            function() { return start < total; },
            function(callback) {
                coll.find(sql, field).limit(MAX_RECORD).skip(start).toArray(function(error, values) {
                    if (!error) {
                        for (var i = 0; i < values.length; ++i) {
                            func(values[i]);
                        }
                        start += MAX_RECORD;
                    }
                    return callback(error);
                });
            },
            function(error, res) {
                db.close();
                return cb(error);
            }
        );
    });
};
