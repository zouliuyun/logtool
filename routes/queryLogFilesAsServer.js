var fs = require('fs');
var async = require('async');
var utilityFunc = require('../models/UtilityFunction');

var handler = module.exports;

handler.index = function(req, res) {
    var _stash = req.body;
    _stash.title = 'login';
    _stash.platform = '1';
    if (_stash.platform == '1') {
        _stash.servers = utilityFunc.getCNConfig();
    } else {
        _stash.servers = utilityFunc.getTWConfig();
    }
    
    var _directory;
    
    async.series({
        checkParam: function(callback){
            if (!_stash.submit) return callback('not submit');
            if (!_stash.server) return callback('not select server');
            
            if (typeof(_stash.server) == 'string') {
                _stash.server = _stash.server.split('/');
            } else {
                _stash.server = _stash.server[0].split('/');
            }
            //
            return callback(null);
        },
        queryDirectory: function(callback) {
            fs.readdir('./game', function(error, doc) {
                if (error) return callback('read dir error');
                
                _directory = doc;
                return callback(null);
            });
        },
        queryFiles: function(callback) {
            _stash.files = [];
            var start = 0;
            async.whilst(
                function() {return start < _directory.length;},
                function(cb) {
                    fs.readdir('./game/'+_directory[start], function(error, doc) {
                        if (error) return callback('read dir error 2');
                        for (var i in doc) {
                            //console.log('=======>>0108:\t', _stash.server);
                            _stash.files.push({_id: start, server: _stash.server, node: _directory[start], file:doc[i]});
                        }
                        ++start;
                        cb(null);
                    });
                },
                function(error, doc) {
                    return callback(null);
                }
            );
        },
        deleteFiles: function(callback) {
            if (_stash.submit == 'delete') {
                if (!_stash.chFiles) return callback(null);
                if (typeof(_stash.chFiles) == 'string') {
                    var _node, _filename;
                    for (var i in _stash.files) {
                        if (_stash.files[i]._id == parseInt(_stash.chFiles)) {
                            _node = _stash.files[i].node;
                            _filename = _stash.files[i].file;
                            _stash.files.splice(i, 1);
                        }
                    }
                    fs.unlink('./game/'+_node+'/'+_filename, function(error, doc) {
                        for (var i in _stash.files) {
                            if (_stash.files[i]._id == parseInt(_stash.chFiles)) _stash.files.splice(i, 1);
                        }
                        return callback(null);
                    });
                } else {
                    var start = 0;
                    async.whilst(
                        function() {return start < _stash.chFiles.length;},
                        function(cb) {
                            var _node, _filename;
                            for (var i in _stash.files) {
                                if (_stash.files[i]._id == parseInt(_stash.chFiles[start])) {
                                    _node = _stash.files[i].node;
                                    _filename = _stash.files[i].file;
                                    _stash.files.splice(i, 1);
                                }
                            }
                            fs.unlink('./game/'+_node+'/'+_filename, function(error, doc) {
                                ++start;
                                return cb(null);
                            });
                        },
                        function(error, doc) {
                            return callback(null);
                        }
                    );
                }                
            } else {
                return callback(null);
            }            
        },
//        db: function(callback) {
//            req.app.get('db').game_user.findOne({}, {n:1}, function(error, doc) {
//                console.log('=========>>0102:\t', error, doc);
//                return callback(null);
//            })
//        }
    }, function(error, doc) {
        console.log('========>>>0106:\t', error, doc, _stash);
        return res.render('queryLogFilesAsServer', {stash: _stash});
    });
};
