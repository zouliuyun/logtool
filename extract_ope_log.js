var fs = require('fs');
var async = require('async');
var child_process = require('child_process');
var spawn = require('child_process').spawn;
var mongo = require("mongodb");
var Db = require('mongodb').Db;
var Server = mongo.Server;
var Collection = mongo.Collection;
var async = require('async');

var serverConf = require('./serverList').data;

var _dir = "/data/log/";
var _argv = process.argv.slice(2);

var _platform = 0;
var _dateTime = 0;
var _analyseOpeFile = "/data/nba2/tools/analyse_nba2_log_server_node.py";
var _filter = '| grep -v OPE_RESET_CARD_TX_INFO | grep -v OPE_PUSH_EVENT_NEWOFFER | grep -v OPE_PUSH_EVENT_EXPIRE ';

main();

function checkArgv() {
	if (_argv.length != 1) {
		console.log("usage: node extract_ope_log.js platform(simp, trad))"); 
		process.exit(1);
	}
/*
	if (_argv[0] != "simple" && _argv[0] != "complex") {
		console.log("Please check  input parameter, platform is must in (simple, complex).");
		console.log("Usage: node extract_ope_log.js platform(simple, complex)"); 
		process.exit(1);
	} */
	
	_platform  = _argv[0]; 
	_dateTime = getTodayStartTime();
}

function main() {
	// 检测命令行参数
	checkArgv();

	extractLogs();
}

function execAnalyseOpeLog(server, node, callback) {
    if(parseInt(node) < 10) node = '0' + node;
	var path = _dir + "game"+ server + "/node" + node + "/game1.log." + getTodayDate()+".gz";
	console.log(getTime()+ path+" [start]");
	// 文件是否存在
	fs.exists(path, function(exists) {
		if (!exists) {
			console.log(getTime()+path+ ' [Error:not exists]');
			callback(0);
		} else {
			var cmd = "zgrep -a OPE " + path + _filter + "|/usr/bin/python " + _analyseOpeFile + " " + _platform + " " + server + " "  + node; 
			console.log(cmd);
			// spawn来完成，就不会有maxBuffer的限制 1*G 
			child_process.exec(cmd, {maxBuffer:1024*1024*1024}, function(err, stdout, stderr) {
				console.log('==============================================================');
				console.log(stderr);
				console.log(stdout);
				console.log('==============================================================');
				if (!err) {
					// 导入成功
					console.log(getTime()+ path+" [end]");
				   	callback(1);
				} else {
					console.log(getTime()+ path +' ['+ err +']');
					callback(0);
				}
			});
		}
	})
}

function extractLogs() {
	var arr=[];
	var servers = Object.keys(serverConf);	
	
	var start = 0;
	async.whilst(
		function () { return start < servers.length; },
		function (callback) {
			var server = serverConf[start].server;
			var nodes = serverConf[start].node;
			// parallel 
			async.map(nodes, 
				function(item, cb) {
				    //console.log(server, item);
				    execAnalyseOpeLog(server, item, function(result) {
						cb(null, result);
					}) 
			    },
				function(err, results){
					//console.log(JSON.stringify(results))
					//var flg = getExtractFlag(results);
					//updateProcess(server, flg, function(err, result){
					//	if (err) {
					//		console.log("insert process err:", server, flg);
					//	}
						start++;
						callback(err);
				//	})
				})
		},
		function (err) {
			console.log(new Date() + "extract all logs!");
		//	_ope_db.close();	
		}
	);
}

function getTodayDate(){
	var date = new Date();
	return date.getFullYear()*10000+(date.getMonth()+1)*100+date.getDate();
}

function getTime() {
	return "[" + new Date() + "] "
}

function getDateString(tm) {
	var date = new Date(tm * 1000);
	return date.getFullYear()+"-" +(date.getMonth()+1)+"-"+date.getDate();
}

// 时间戳
function getTodayStartTime() {
	var date = new Date();
	date.setHours(0);
	date.setMinutes(0);
	date.setSeconds(0);
	return parseInt(date.getTime()/1000);
}

/*
//# 更新日志导入进度， 0没有导入 1部分导入 2完全导入  
// ut 更新时间戳
//#{s:1, typ:1, f:2, t} // 日志导入进度
function insertProcess(server, flag, callback) {
	var date = new Date(); 
	var doc = {s:server, typ:1, f:flag, ut:parseInt(date.getTime()/1000), t:_dateTime};
	_ope_coll.insert(doc,  function(err, result) {
		callback(err, result);
	});
}

// 最新一个月的漏传情况检查
function getLogProcess(startTime, endTime, callback) {
	var address = "10.96.36.181";
	var dbname = "operation_test";
	var status =["没有导入", "部分导入", "全部导入"]
	var result = [];
	var opedb = new Db(dbname, new Server(address, 27017, {auto_reconnect: true}), {safe: true});
	opedb.open(function(err, opedb) {
		var opecoll = new Collection(opedb, "nba_log_record");
		// 状态
		opecoll.find({typ:1, f:{$ne:2}, t:{$gt:startTime, $lt:endTime}}).toArray(function(err, docs) {
			//console.log(docs);
			if (!err) { 
				for(var i=0; i< docs.length; i++) {
					result.push({'s':docs[i].s, "t":getDateString(docs[i].t), "f":status[docs[i].f]});
				}
			}

			console.log(JSON.stringify(result));
			callback(err, result);
		});
	});
}

function updateProcess(server, flag, callback) {
        var now = new Date();
        var doc = {server:server, node:1, f:flag, ut:parseInt(now.getTime()/1000), t:_dateTime};
        _ope_coll.update({s:server, t:_dateTime, typ:1}, {$set:doc}, {upsert:true}, function(err, result) {
                callback(err, result);
        });
}
*/

