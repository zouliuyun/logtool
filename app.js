/**
 * config: express 4.x bootstrap2.x
 * auth: zhao jianwei
* **/
var path = require('path');
var logger = require('morgan');
var express = require('express');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var session = require('express-session');
var cookieParser = require('cookie-parser');

var routes = require('./routes/index');
var timerTask = require('./models/TimerTask');
var util = require('./models/UtilityFunction');

var app = express();
// view engine setup
app.set('dbname', 'hello word!');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({limit: '3mb'}));
app.use(bodyParser.urlencoded({extended: true , limit: '3mb'}));
//app.use(require('express-json-2-csv')());

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//global.Models = models(__dirname + '/models')

routes(app);

timerTask();

util.checkAndCreateDir(util.tempFilePath);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
