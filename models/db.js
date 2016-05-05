var mongoClient = require('mongodb').MongoClient;
var settings = require('../settings').server;
var Version = require('../models/UtilityFunction').version;
var utilityFunc = require('../models/UtilityFunction');

var handler = module.exports;

//获取game_db备库连接
handler.getGameDBBackUp = function(platform, version, dbname, mongo_date, callback) {
    if (!platform || !dbname || !mongo_date) 
        return callback(1);
    var backupSetting;
    if (platform == 1) {
        backupSetting = (version == Version.ios) ? settings.simple.game_db_ios_backup : settings.simple.game_db_android_backup;
    } else {
        backupSetting = settings.traditional_game_db_backup;
    }
    var address = backupSetting.host + ':' + backupSetting.port;

    //备库日期命名按照产生日期
    mongo_date = utilityFunc.getBackUpDate(mongo_date);

    console.log('getGameDBBackUp====>', backupSetting, mongo_date, dbname);

    mongoClient.connect('mongodb://' + address + '/' + backupSetting.db + mongo_date, function(error, db) {
        if(error) return callback(2);
        db.collection(dbname, function(error, collection) {
            if(error)   return callback(error);
            return callback(null, db, collection);
        });
    });
};

//获取login_db备库连接
handler.getLoginDBBackUp = function(platform, version, dbname, mongo_date, callback) {
    if (!platform || !dbname || !mongo_date) 
        return callback(1);
    var backupSetting;
    if (platform == 1) {
        backupSetting = (version == Version.ios) ? settings.simple.login_db_ios_backup : settings.simple.login_db_android_backup;
    } else {
        backupSetting = settings.traditional_login_db_backup;
    }
    var address = backupSetting.host + ':' + backupSetting.port;

    //备库日期命名按照产生日期
    mongo_date = utilityFunc.getBackUpDate(mongo_date);

    mongoClient.connect('mongodb://' + address + '/' + backupSetting.db + mongo_date, function(error, db) {
        if(error) return callback(2);
        db.collection(dbname, function(error, collection) {
            if(error)   return callback(error);
            return callback(null, db, collection);
        });
    });
};

handler.getNBA2OpeDB = function(platform, server, callback) {
    if (!platform || !server) return callback(1);
    
    //1: 简体版, 2: 繁体版
    var logSetting = (platform == 2) ? settings.traditional_log : settings.simple.log;
    var address = logSetting.host + ':' + logSetting.port;

    mongoClient.connect('mongodb://' + address + '/' + logSetting.db, function(error, db) {
        if (error) return callback(error);            
        db.collection('nba2_ope_log_'+server, function(error, collection){
            if (error) return callback(error);    
            return callback(null, db, collection);
        });
    });
};

handler.getNBA2OpeConfigDB = function(platform, dbname, callback) {
    if (!platform || !dbname) return callback(1);
    
    //1: 简体版, 2: 繁体版
    var logSetting = (platform == 2) ? settings.traditional_ope_config : settings.simple.ope_config;
    var address = logSetting.host + ':' + logSetting.port;

    mongoClient.connect('mongodb://' + address + '/' + logSetting.db, function(error, db) {
        if (error) return callback(error);            
        db.collection(dbname, function(error, collection){
            if (error) return callback(error);    
            return callback(null, db, collection);
        });
    });
};

//获取game_db从库连接
handler.getGameDBSlave = function(platform, version, dbname, callback) {
    if (!platform || !dbname) 
        return callback(1);
    var slave;
    if (platform == 1) {
        slave = (version == Version.ios) ? settings.simple.game_db_ios_slave: settings.simple.game_db_android_slave;
    } else {
        slave = settings.traditional_game_db_slave;
    }
    var replSet = [
        slave.game_db0.host + ':' + slave.game_db0.port, 
        slave.game_db1.host + ':' + slave.game_db1.port,
        slave.game_db2.host + ':' + slave.game_db2.port
    ].join(',').toString();

    console.log('getGameDBSlave====>: ', replSet);

    mongoClient.connect('mongodb://' + replSet + '/' + 'game_db?readPreference=secondaryPreferred&auto_reconnect=true', function(error, db) {
        if(error) return callback(2);
        db.collection(dbname, function(error, collection) {
            if(error)   return callback(error);
            return callback(null, db, collection);
        });
    });
};

//获取login_db从库连接
handler.getLoginDBSlave = function(platform, version, dbname, callback) {
    if (!platform || !dbname) 
        return callback(1);
    var slave;
    if (platform == 1) {
        slave = (version == Version.ios) ? settings.simple.login_db_ios_slave : settings.simple.login_db_android_slave;
    } else {
        slave = settings.traditional_login_db_slave;
    }
    var replSet = [
        slave.login_db0.host + ':' + slave.login_db0.port, 
        slave.login_db1.host + ':' + slave.login_db1.port,
        slave.login_db2.host + ':' + slave.login_db2.port
    ].join(',').toString();

    console.log('getLoginDBSlave====>: ', replSet);

    mongoClient.connect('mongodb://' + replSet + '/' + 'login_db?readPreference=secondaryPreferred&auto_reconnect=true', function(error, db) {
        if(error) return callback(2);
        db.collection(dbname, function(error, collection) {
            if(error)   return callback(error);
            return callback(null, db, collection);
        });
    });
};
