var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var Mongo = require('mongodb');

var indexRouter = require('./routes/index');
var Generate = require('./server-lib/gr_generate.js');

// host name is the name of the container in docker-compose.yml
var MONGO_HOST = 'mongo';
var dbName = 'planetarydb';
// see docker-compose for environment vars
var MONGO_URL = 'mongodb://' +  
                process.env.ME_CONFIG_MONGODB_ADMINUSERNAME + ':' + 
                process.env.ME_CONFIG_MONGODB_ADMINPASSWORD + '@' + 
                MONGO_HOST + ':27017/' + dbName;
console.log("Connecting to mongodb at " + MONGO_URL);
var mongoClient = Mongo.MongoClient;
mongoClient.connect(MONGO_URL, function(err, db) 
{
  if (err) throw err;
  console.log(dbName + ' created!');

  var dbo = db.db(dbName);
  dbo.createCollection("planets", function(err, res) 
  {
    if (err) throw err;
    console.log("Collection created!");
    db.close();
  }); // end createCollection
}); // end connect

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
for(var planet in theUniverse)
{
  //
}

module.exports = app;
