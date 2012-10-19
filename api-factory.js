module.exports = (function () {
    var that = this,
        Crud = require('./crud'),
        Router = require('./router'),
        Responder = require('./responder');
    
    // Manager for routers and CRUD
    // Creates a new API
    var Api = function (name) {
        var responder = new Responder();
        
        // Handles database CRUD
        var crud = new Crud(name, that.db);

        // Maps requests to CRUD methods
        var router = new Router(name, that.app, crud, responder);
        
        return;
    };
    
    // Factory Method
    return function (wish) {
        that.app = wish.app;
        that.db = wish.db;
        
        return Api;
    };
    
}());