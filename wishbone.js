(function () {
    var _ = require('underscore'),
        Backbone = require('backbone'),
        http = require('http'),
        Database = require('./database'),
        App = require('./app'),
        Controller = require('./controller');
    
    var Wishbone = (function () {
        var that = this;
        
        return {
            
            initialize: function (options) {
                if (!options) {
                    options = {};
                }
                
                this.db = new Database(options.db);
                this.server = new App(options.server);

                this.Controller = Controller.extend({
                    db: this.db,
                    server: this.server
                });
            },
            
            start: function () {
                var that = this;
                
                this.db.open(function(err, db) {
                    if(!err) {
                        console.log("Conncected to database");
                    } else {
                        console.log("Error:");
                    }
                });
                
                require('http').createServer(this.server).listen(this.server.get('port'), function(){
                    console.log("Wishbone is listening on port " + that.server.get('port'));
                });
            }
        };
        
    }());
    
    module.exports = Wishbone;

}());