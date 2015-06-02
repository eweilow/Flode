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


app.use(function (req, res, next) {
  res.locals.activePage = req.path;
  
  next();
});

require("./passport/passport.js").init(app);

app.use('/', indexRoute);
app.use('/upload', uploadRoute.router);
app.use('/browse', browseRoute.router);

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


module.exports.app = app;
module.exports.initWebsocket = function (httpServer) {
  var websocket = require("websocket");

  var WebSocketServer = websocket.server;

  var wsServer = new WebSocketServer({
    httpServer: httpServer,
    autoAcceptConnections: false
  });
  
  var conns = [ ];
  // Create a callback to handle each connection request
  wsServer.on('request', function (request) {
    var connection = request.accept();
    console.log((new Date()) + ' Connection accepted from ' + request.origin);

    conns.push(connection);
   /*
    // Callback to handle each message from the client
    connection.on('message', function (message) {
      if (message.type === 'utf8') {
        console.log('Received Message: ' + message.utf8Data);
        connection.sendUTF(message.utf8Data);
      }
      else if (message.type === 'binary') {
        console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
        connection.sendBytes(message.binaryData);
      }
    });*/
   
    // Callback when client closes the connection
    connection.on('close', function (reasonCode, description) {
      console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
  });
  
  var allowed = [".png", ".jpg", ".bmp", ".mov", ".mp4"];
  
  uploadRoute.callback(function (path) {
    console.log("sending for path", path);
    var hit = false;
    for (var index = 0; index < allowed.length; index++) {
      var element = allowed[index];
      if (path.toLowerCase().indexOf(element) > 0) hit = true;
    }
    if (!hit) return console.log("Unallowed extension for path", path);
    
    var json = "";
    if (path.toLowerCase().indexOf(".mov") > 0 || path.toLowerCase().indexOf(".mp4") > 0)
      json = JSON.stringify({ "type": "movie", "path": path });
    else
      json = JSON.stringify({ "type": "picture", "path": path });
      
    for (var index = 0; index < conns.length; index++) {
      var element = conns[index];
      
    
      
      element.sendUTF(json);
    }
    
  });
};