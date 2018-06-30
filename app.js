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
// Should the database be cleared and regenerated 
// when the app starts?
// This is primarily for development to test setup
var RESET_DB_ON_START = process.env.RESET_DB_ON_START=="true"; // can't pass bools I guess???
// Does the database already have a generated universe in it?
var universePreExists = false;
// There are things we don't want to do until the existence
// of a universe has been confirmed or denied.
var universePreExistenceEstablished = false;
// It is possible that a client will connect and request
// universe data before the database has been populated with universe 
// data. Sooooo we maintain an array of sockets which have requested 
// data and then send it to them when it has been generated
var uniGeneratedAndStored = false;
var uniDatReqs = []

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

// keep trying to connect every 2 secs until it works
var checkIfUniverseGenerated = setInterval(function() // has the universe already been generated?
{
  console.log("Waiting for mongo");
  mongoClient.connect(MONGO_URL, function(_err1, _db) 
  {
    var db = _db.db(dbUniverseName);
    if(!_err1)
    {
      clearInterval(checkIfUniverseGenerated); // stop this check

      db.collection("planets", function(_err2, _res)
      {
        universePreExists = !Boolean(_err2);
        universePreExistenceEstablished = true;

        console.log("Checked universe existence: " + universePreExists);

        if(RESET_DB_ON_START && universePreExists)
        {
          console.log("Universe exists but DB is flagged to be reset");
          db.dropCollection("planets", function(_err3, _res2){if(_err3){console.log("could not remove collection")}});
          universePreExists = false;
        }

        if(!universePreExists)
        {
          console.log("Universe does not exist or has been removed so creating");
          // generate the universe
          var theUniverse = Generate.generateUniverse();

          db.createCollection("planets", function(_err3, _res3)
          {
            console.log("Creating planets collection");
            if(_err3)
            {
              console.log("Error creating planets collection");
              console.log(_err3);
            }
            else
            {
              console.log("Successfully created universe collection");  
              db.collection("planets").insertMany(theUniverse, function(_err4, _res4)
              {
                if(_err4)
                {
                  console.log("Error inserting planets into db");
                  console.log(err4);
                }
                else
                {
                  console.log("Successfully added universe to db");
                  uniGeneratedAndStored = true;

                  // send universe to those clients that have been waiting
                  for(var ndx in uniDatReqs)
                  {
                    fetchUniverseAndSend(uniDatReqs[ndx]);
                  }

                  uniDatReqs = []; // clear requests

                  _db.close();
                }
              });
            }
          });
        }
      });

    };
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
    // Is the universe ready?
    if(uniGeneratedAndStored)
    {
      fetchUniverseAndSend(_sock);
    }
    // if not add to request list
    else
    {
      uniDatReqs.push(_sock);
    }
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

/**
 * Provide a websocket. Load planet data. Send to socket.
 */
function fetchUniverseAndSend(_sock)
{
  mongoClient.connect(MONGO_URL, function(_err1, _db)
  {
    console.log("Mongo connection successful");
    var db = _db.db(dbUniverseName);
    if(!_err1)
    {
      // to hold planet data received from db
      var planetArray = [];
      // get a cursor to a bunch of data
      var cursor = db.collection("planets").find({});
      // go through each doc and add to array
      cursor.forEach(
        function(_doc) // iterator callback
        {
          console.log("I am iterating yay");
          // add doc to array
          planetArray.push(_doc);
        },

        function(_err2) // end callback
        {
          if(_err2) 
          {
            console.log(_err2);
            return;
          }

          if(planetArray.length > 0)
          {
            console.log("Sending data");
            _sock.emit('universe-gen', planetArray);
          }
          else
          {
            console.log("For some reason the planet array is empty.");
          }
        }
      );


    }
  });
}


 