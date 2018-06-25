var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var Mongo = require('mongodb');

var indexRouter = require('./routes/index');
var Generate = require('./server-lib/gr_generate.js');

// host name is the name of the container in docker-compose.yml
var MONGO_HOST = 'growth-db';
// this will hold universe information
var dbName = 'universedb';
// see docker-compose for environment vars
var MONGO_URL = 'mongodb://' +  
                process.env.GROWTH_DB_USER + ':' + 
                process.env.GROWTH_DB_PASSWORD + '@' + 
                MONGO_HOST + ':27017/' + dbName;
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
    var db = _db.db(dbName);
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


module.exports = app;

 