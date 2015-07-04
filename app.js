var express = require('express');
var app = express();
var config = require('./routes/config')();
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var ejs = require('ejs');
var fs = require('fs');
var session = require('express-session');
var flash = require('connect-flash');
var chat = require('./routes/chat');
var server = require('http').createServer(app);
var io = require('socket.io')(server);

io.adapter(require('socket.io-redis')({ host: config.redisHost, port: config.redisPort }));

var accesslog = fs.createWriteStream(__dirname + "/logs/access.log", {flags : 'a'});
app.set('port', config.nodejsPort);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine(".html",ejs.__express);
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('combined', {stream : accesslog}));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({secret: config.sessionSeed,resave:false,saveUninitialized:true,cookie: {maxAge: 80000 }}));
//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

chat.web(app);
chat.connect(io);

/**404
app.use(function(req,res,next){
	var error = new Error("Not Found");
	error.status = 404;
	next(error);
});

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: err
    });
});
**/

process.on('uncaughtException', function(error){
    //logger.error(error);
});

server.listen(app.get('port'),function(){
  console.log('Express server listening on port ' + app.get('port'));
});

//module.exports = app;
