var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var Mongo = require('mongodb');
var SocketIO = require('socket.io');
var Debug = require('debug');
var Http = require('http');

// Setup debug
debug = Debug('growth:server');

// server stuff
var port = normalizePort('80');

var indexRouter = require('./routes/index');
var Generate = require('./server-lib/gr_generate.js');

// host name is the name of the container in docker-compose.yml
var MONGO_HOST = 'growth-db';
// this will hold universe information
var dbUniverseName = 'universedb';
// see docker-compose for environment vars
var MONGO_URL = 'mongodb://' +  
                process.env.GROWTH_DB_USER + ':' + 
                process.env.GROWTH_DB_PASSWORD + '@' + 
                MONGO_HOST + ':27017/' + dbUniverseName;
var mongoClient = Mongo.MongoClient;

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// generate the universe
var theUniverse = Generate.generateUniverse();

// keep trying to connect every 2 secs until it works
var addUniverseToDb = setInterval(function()
{
  console.log("Waiting for mongo");
  mongoClient.connect(MONGO_URL, function(_err1, _db) 
  {
    var db = _db.db(dbUniverseName);
    if(!_err1)
    {
      clearInterval(addUniverseToDb);
      db.createCollection("planets", function(_err2, _res2)
      {
        if(_err2)
        {
          console.log(_err2);
        }
        else
        {
          console.log("Successfully created universe collection");  
          db.collection("planets").insertMany(theUniverse, function(_err3, _res3)
          {
            if(_err3)
            {
              console.log(err3);
            }
            else
            {
              console.log("Successfully added universe to db");
              _db.close();
            }
          });
        }
      });
    }
    else
    {
      console.log(_err1);
    }
  }); // end connect
}, 2000);

// make the server
app.set('port', port);
var server = Http.createServer(app);
var socket = SocketIO(server);
socket.on('connection', function(_sock)
{
  console.log("A Thing Connected!");

  // has requested universe info?
  _sock.on('universe-gen', function(_fn)
  {
    console.log("Received request for world gen");
    // lets connect to mongo, where the info is!
    mongoClient.connect(MONGO_URL, function(_err1, _db)
    {
      console.log("Succ conn to mdb after req wg");
      var db = _db.db(dbUniverseName);
      if(!_err1)
      {
        db.collection("planets").findOne({}, function(_err2, _result)
        {
          console.log("Found a thing in the collection of the datathing");
          if(!_err2)
          {
            console.log("Sending world gen"); 
            _sock.send('universe-gen', _result);
          }
        });
      }
    });
  });

});


server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

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


 