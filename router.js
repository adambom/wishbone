var Backbone = require('backbone'),
    _ = require('underscore');

var Router = Backbone.Router.extend({

    _bindRoutes: function() {
        if (!this.routes) {
            return;
        }

        _.each(this.routes, function (handler, route) {
            var parts = route.split(' '),
                method = parts.shift().toLowerCase(),
                path = parts.shift(),
                fn = this[handler] || function () {};

            this.app[method]('/' + path, _.bind(fn, this));
        }, this);

    },
    
    create: function (req, res, next) {
        this.crud.create(req.body, _.bind(this.responder.trigger, this.responder));
    },
    
    read: function (req, res, next) {
        this.crud.read(req.params.id, _.bind(this.responder.trigger, this.responder));
    },
    
    update: function (req, res, next) {
        this.crud.update(req.params.id, req.body, _.bind(this.responder.trigger, this.responder));
    },
    
    'delete': function (req, res, next) {
        this.crud.delete(req.params.id, _.bind(this.responder.trigger, this.responder));
    },
    
    all: function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS"); 
        res.header("Access-Control-Allow-Headers", "content-type, accept");
        
        this.responder.set({ res : res });
        next();
    }
});

module.exports = function (name, app, crud, responder) {
    var routes = {};
    
    routes['ALL api/' + name + '/:id?'] = 'all';
    routes['GET api/' + name + '/:id?'] = 'read';
    routes['POST api/' + name] = 'create';
    routes['PUT api/' + name + '/:id'] = 'update';
    routes['DELETE api/' + name + '/:id?'] = 'delete';
    
    
    Router = Router.extend({ 
        routes: routes,
        app: app,
        crud: crud,
        responder: responder
    });
    
    return new Router();
};
