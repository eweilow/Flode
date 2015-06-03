argv = require("optimist").string("admin").string("password").argv;

var express = require('express');
var session = require("express-session");
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var indexRoute = require('./routes/index');
var uploadRoute = require('./routes/upload');
var browseRoute = require('./routes/browse');

var multer  = require('multer')

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));


var fs = require("fs");
if (!fs.existsSync("./uploads")){
  fs.mkdirSync("./uploads");
}
app.use(multer({ dest: './uploads/' }));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public_media')));

var SessStore = require("./sessionstore")(session);
app.use(session({ secret: "verytopsecret", saveUninitialized: true, resave: false, store: new SessStore({ directory: ".session" }) })); // Session middleware


var lang = require("file-distribute").config.readOrMake("./config/language.json", function () { 
  return { index: { upload: "Upload", browse: "Browse", user: "User", settings: "Settings" } };
});

fs.watchFile('./config/language.json', function (curr, prev) {
  if (+curr.mtime === +prev.mtime) { }
  else {
    console.log("Reloaded language file");
    lang = require("file-distribute").config.readOrMake("./config/language.json", function () { 
      return { index: { upload: "Upload", browse: "Browse", user: "User", settings: "Settings" } };
    });
  }
});

app.use(function (req, res, next) {
  res.locals.activePage = req.path;
  res.locals.lang = lang;
  
  res.locals.messages = req.session.messages;
  req.session.messages = [];
  res.message = function (str) {
    req.session.messages.push(str);
  };
  next();
});

app.disable("etag");

require("./passport/passport.js").init(app);

var cfg = require("file-distribute").config.readOrMake("./config/defaultnode.json", function () { 
  return { port: 8081, host: "localhost", segmentation: 10, basepath: "./public_media", apikey: "", allowedfiletypes: [] };
});
cfg = require("file-distribute").config.override(argv, cfg);

var node = require("file-distribute").node;
node.configuration(cfg);
node.connect();  
node.initialize();

var timeCfg = require("file-distribute").config.readOrMake("./config/nodetimings.json", function () { 
  return { "seconds-between": 60.0, "connect-timeout": 15.0 };
});

var seconds = timeCfg["seconds-between"];
var timeout = timeCfg["connect-timeout"];

setInterval(function () {
  node.connect();
  setTimeout(function () {
    node.disconnect();
  }, timeout * 1000); 
}, seconds * 1000);

app.use('/', indexRoute);
app.use('/upload', uploadRoute.router(cfg.allowedfiletypes));
app.use('/browse', browseRoute.router(app, node.repositories("offsite"), node.repositories("local")));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

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

var initWebsocket = function (httpServer) {

};

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

var http = require("http");
var server = http.createServer(app);
initWebsocket(server);

var port = normalizePort(argv.serverport || 3000);
app.set('port', port);

server.listen(port);

console.log("Listening on port", port);

server.on('error', onError);
server.on('listening', onListening);

var debug = require('debug')('flode:server');

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
