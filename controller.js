var _ = require('underscore'),
    mongo = require('mongodb');

var noop = function () {};

var Controller = function (options) {
    options = options || {};

    if (options.routes) {
        _.extend(this.routes || {}, options.routes);
    }
    
    if (options.resource) {
        this.resource = options.resource;
    }
    
    if (options.prefix) {
        this.prefix = options.prefix;
    }
    
    this._bindCollection();
    this._bindRoutes();
    this.initialize.apply(this, arguments);
};

Controller.extend = require('./extend');

_.extend(Controller.prototype, {
    
    routes: {
        'ALL /:id?': 'all',
        'GET /:id?': 'read',
        'POST': 'create',
        'PUT /:id': 'update',
        'DELETE /:id': 'destroy'
    },

    root: 'api',

    _bindRoutes: function () {
        var root = _.result(this, 'root');

        _.each(this.routes, function (handler, route) {
            var parts = route.split(' '),
                verb = parts.shift().toLowerCase(),
                route = parts.shift(),
                callback = _.bind(this[handler] || noop, this);
                
            this.server[verb]((this.prefix ? '/' + this.prefix : '') + '/' + this.resource + (route || ''), callback);
        }, this);
    },
    
    _bindCollection: function () {
        var that = this;

        this.db.collection(this.resource, function(err, collection) {
            that.collection = collection;
        });
    },

    initialize: noop,

    create: function (request, response, next) {
        var record = _.extend(request.body, {
            _id: new mongo.ObjectID()
        });
        
        try {
            this.collection.insert(record);
        } catch (e) {
            return this.respondWith('500', {message: 'Unable to insert into the db.'});
        }
        
        this.respondWith('201', record);
    },

    read: function (request, response, next) {
        var that = this;
        
        var onComplete = function (err, items) {
            that.respondWith('200', items);
        };
        
        if (request.params.id) {
            this.collection.findOne({ _id : new mongo.ObjectID(request.params.id) }, onComplete);
        } else {
            // TODO: Stream records rather than load them all using toArray
            this.collection.find({}).toArray(onComplete);
        }
    },

    update: function (request, response, next) {
        var id = new mongo.ObjectID(request.params.id),
            doc = request.body;
        
        delete doc._id;
           
        this.collection.update({ _id : id }, { $set : doc }, true);
        
        doc._id = request.params.id;
        
        this.respondWith('201', doc);
    },

    destroy: function (request, response, next) {
        var id = request.params.id;

        if (id) {
            id = new mongo.ObjectID(id);
            this.collection.remove({ _id : id });
        } else {
            this.collection.remove();
        }
        
        this.respondWith('201');
    },

    all: function (request, response, next) {
        response.header('Access-Control-Allow-Origin', '*');
        response.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS'); 
        response.header('Access-Control-Allow-Headers', 'content-type, accept');

        this.response = response;
        next();
    },
    
    respondWith: function (code, body) {
        this.response.end(JSON.stringify(body));
    }
});


module.exports = Controller;