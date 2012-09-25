# Wishbone

Wishbone is a dead simple rest API framework for Node.js that uses backbone and MongoDB.

## Installation
`npm install -g wishbone`


## Usage
1. Fire up mongodb `sudo mongod`
2. `require('wishbone')`
3. Write your code

```javascript
var express = require('express'),
    http = require('http'),
    path = require('path'), 
    _ = require('underscore'),
    db = require('./db');

var app = express(),
    BaseAPI = require('./api/base');

app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('your secret here'));
    app.use(express.session());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});


var scenariosAPI = new BaseAPI('scenarios', app, db);
var skusAPI = new BaseAPI('skus', app, db);
var promotionsAPI = new BaseAPI('promotions', app, db);
var historiesAPI = new BaseAPI('histories', app, db);


http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
```