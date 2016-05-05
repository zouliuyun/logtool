var md5 = require('md5');
var async = require('async');
var validate = require('validate');
var handler = module.exports;

handler.index = function(req, res){
    var _stash = req.body;
    _stash.title = 'login';
    
    if (!_stash.submit) {
        return res.render('login', {stash: _stash});
    }

    async.series({
        checkValidate: function(callback) {
            var _data = validate({
                username: {type: 'string', required: true, message: 'username is required'},
                password: {type: 'string', required: true, message: 'password is required'}
            }, _stash);
            if (Array.isArray(_data)) {
                var _error = '';
                _data.forEach(function(elem) {
                    _error += elem.toString();
                });
                return callback(_error);
            }

            return callback(null);
        },
        checkAuthenticate: function(callback) {
            if (_stash.username == 'admin' && _stash.password == 'admin') {
                _stash.hasLogin = true;
                req.session.hasLogin = true;
                req.session.platform = '1';
                req.session.username = _stash.username;
                return callback(null);
            } else {
                return callback('error');
            }
        }
    }, function(error, doc) {
        if (error) {
            _stash.error = error;
            res.render('login', {stash: _stash});
        } else {
            res.render('index', {stash: _stash});
        }
    });

};
