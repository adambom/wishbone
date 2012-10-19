(function () {
    var _ = require('underscore'),
        Backbone = require('backbone'),
        http = require('http'),
        Database = require('./database'),
        App = require('./app'),
        ApiFactory = require('./api-factory');
    
    var Wishbone = (function () {
        var that = this;
        
        return {
            
            API: new ApiFactory(that),
            
            initialize: function (options) {
                if (!options) {
                    options = {};
                }
                
                that.db = new Database(options.db);

                that.app = new App(options.app);
            },
            
            start: function () {
                that.db.open(function(err, db) {
                    if(!err) {
                        console.log("Conncected to database");
                    } else {
                        console.log("Error:");
                    }
                });
                
                require('http').createServer(that.app).listen(that.app.get('port'), function(){
                  console.log("Wishbone is listening on port " + that.app.get('port'));
                });
            }
        };
        
    }());
    
    module.exports = Wishbone;

}());
