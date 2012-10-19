module.exports = function (options) {
    var express = require('express'),
        path = require('path');

    var app = express();

    app.configure(function(){
        app.set('port', process.env.PORT || 3000);
        app.use(express.logger('dev'));
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(express.cookieParser('your secret here'));
        app.use(express.session());
        app.use(app.router);
        app.use(express.static(path.join(__dirname, 'public')));
    });
    
    return app;
};

