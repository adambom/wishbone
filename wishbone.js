(function () {
    var _ = require('underscore'),
        Backbone = require('backbone'),
        mongo = require('mongodb'),
        Db = mongo.Db,
        Server = mongo.Server,
        $ = require('jquery'),
        ObjectID = mongo.ObjectID,
        root = this;
    
    var Wishbone = (function () {
        var that = this;

        var getValue = function(object, prop) {
            if (!(object && object[prop])) return null;
            return _.isFunction(object[prop]) ? object[prop]() : object[prop];
        };

        var urlError = function() {
            throw new Error('A "url" property or function must be specified');
        };

        var extend = function (protoProps, classProps) {
            var child = inherits(this, protoProps, classProps);
            child.extend = this.extend;
            return child;
        };

        var ctor = function () {};

        var inherits = function(parent, protoProps, staticProps) {
            var child;

            if (protoProps && protoProps.hasOwnProperty('constructor')) {
                child = protoProps.constructor;
            } else {
                child = function(){ parent.apply(this, arguments); };
            }

            _.extend(child, parent);

            ctor.prototype = parent.prototype;
            child.prototype = new ctor();

            if (protoProps) _.extend(child.prototype, protoProps);

            if (staticProps) _.extend(child, staticProps);

            child.prototype.constructor = child;

            child.__super__ = parent.prototype;

            return child;
        };

        var Router = Backbone.Router = function (options) {
            options = options || {};

            if (options.routes) {
                this.routes = options.routes;
            }

            if (options.name) {
                this.name = options.name;
            }

            if (options.app) {
                this.app = options.app;
            }

            this._bindRoutes();

            this.initialize.apply(this, arguments);
        };

        _.extend(Router.prototype, Backbone.Events, {

            initialize: function () {},

            _bindRoutes: function() {
                if (!this.routes) {
                    return;
                }

                _.each(this.routes, function (handler, route) {
                    var parts = route.split(' '),
                        method = parts.shift().toLowerCase(),
                        path = parts.shift(),
                        fn = this[handler] || function () {};
                    //console.log(_);
                    this.app[method]('/' + path, _.bind(fn, this));
                }, this);

            }
        }, this);

        var Model = Backbone.Model;

        var methodMap = {

            create: function (url) {
                var that = this,
                onComplete = function (err, result) {
                    that.collection.trigger('create:success', result);
                };

                this.collection.db.collection(this.collection.name, function (err, coll) {

                    coll.insert(that.toJSON(), {safe:true}, onComplete);

                });
            },

            update: function (url) {
                var that = this,
                    id = this._id;

                this.collection.db.collection(that.get('name'), function (err, coll) {

                    if (id) {
                        coll.update({ '_id' : new ObjectID(id) }, that.toJSON());
                    }

                });
            },

            "delete": function (url) {
                var that = this,
                    id = this.id;

                this.collection.db.collection(that.get('name'), function (err, coll) {
                        coll.remove({ '_id' : id });
                });
            },

            read: function (url, options) {
                var that = this,
                    id = options.id,
                    name = this.name,
                    suc = options.success ? function () {
                        options.success.call(that, that.toJSON());
                    } : ctor,
                    onRead = function (err, items) {
                        that.reset(items, { silent : true });
                        that.trigger('read:success');
                        suc();
                    };

                this.db.collection(name, function (err, coll) {

                    if (id) {

                        coll.findOne({ '_id' : new ObjectID(id) }, onRead);

                    } else {

                        coll.find().toArray(onRead);

                    }

                });

            }

        };

        Router.extend = extend;
        
        var dbConstructor = function (cfg) {

            var defaults = {
                hostname: 'localhost',
                port: 27017,
                db: 'test',
                username: '',
                password: ''
            };

            cfg = _.extend(defaults, _.clone(cfg));

            cfg.url = function () {
                if (cfg.username && cfg.password) {
                    return 'mongodb://' + cfg.username + ':' + cfg.password + '@' + cfg.hostname + ':' + cfg.port + '/' + cfg.db;
                }

                return 'mongodb://' + cfg.hostname + ':' + cfg.port + '/' + cfg.db;
            };

            return cfg;

        };
        
        var db, app;
        
        var proto = $.extend(true, {}, Backbone);

        return _.extend(Backbone, {
            
            configure: function (config) {
                db = dbConstructor(config.db);
                
                var express = require('express'),
                    path = require('path');
                    
                app = express();
                
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
                
                app.all('/*', function(req, res, next) {
                  res.header("Access-Control-Allow-Origin", "*");
                  res.header("Access-Control-Allow-Headers", "X-Requested-With");
                  next();
                });
            },
            
            start: function () {
                if (!db) {
                    db = Wishbone.configure();
                }
                
                var http = require('http');
                
                http.createServer(app).listen(app.get('port'), function(){
                  console.log("Wishbone is listening on port " + app.get('port'));
                });
                
            },

            sync: function (method, collection, options) {
                method = _.bind(methodMap[method], this);

                options = options || (options = {});

                var url = options.url || getValue(collection, 'url') || urlError();

                method(url, options);
            },

            Router: Router,
            
            BaseAPI: function (namespace) {
                var Collection = Wishbone.Collection.extend({
                    name: namespace,

                    model: Wishbone.Model,

                    initialize: function () {
                        this.on('read:success', this.onReadSuccess, this);
                        this.on('create:success', this.onCreateSuccess, this);
                    },

                    onReadSuccess: function () {
                        this.res.end(JSON.stringify(this.toJSON()));
                    },

                    onCreateSuccess: function (result) {
                        this.res.end(JSON.stringify(result));
                    }
                });

                var routes = {};

                routes['GET api/' + namespace + '/:id?'] = 'read';
                routes['POST api/' + namespace] = 'create';
                routes['PUT api/' + namespace + '/:id'] = 'update';
                routes['DELETE api/' + namespace + '/:id?'] = 'remove';

                var Api = Wishbone.Router.extend({

                    app: app,

                    name : namespace,

                    routes: routes,

                    initialize: function () {
                        var that = this;
                        
                        this.collection = new Collection();
                        this.collection.app = app;
                        this.collection.url = db.url();
                        this.collection.server = new Server(db.hostname, db.port, {auto_reconnect: true});
                        this.collection.db = new Db(db.db, this.collection.server);
                        
                        this.collection.db.open(function(err, d) {
                            if(!err) {
                                console.log('Connected to ' + db.db);
                                
                                d.createCollection(that.name, function(err, collection) {});
                            }
                        });
                    },

                    create: function (req, res) {
                        this.collection.create(req.body, {
                            req: req,
                            res: res
                        });
                    },

                    read: function (req, res) {
                        this.collection.fetch({
                            id : req.params.id, 
                            req: req,
                            res: res
                        });
                    },

                    update: function (id) {

                    },

                    delete: function (id) {

                    }

                });

                return new Api();
            },

            Collection: Backbone.Collection.extend({

                fetch: function (options) {
                    options = options ? _.clone(options) : {};

                    if (options.parse === undefined) options.parse = true;

                    this.res = options.res;
                    this.req = options.req;
                    this.next = options.next;   

                    var collection = this;

                    var success = options.success;

                    options.success = function(resp, status, xhr) {
                        collection[options.add ? 'add' : 'reset'](collection.parse(resp, xhr), options);
                        if (success) success(collection, resp);
                    };

                    options.error = Backbone.wrapError(options.error, collection, options);

                    return (this.sync || Backbone.sync).call(this, 'read', this, options);
                },

                add: function (models, options) {
                    models = _.isArray(models) ? models.slice() : [models];

                    var ids = this.pluck('_id');

                    var duplicates = _.filter(models, function (model) {
                        return _.include(ids, model._id);
                    });

                    if (duplicates && duplicates.length) {
                        this.remove(duplicates, { silent : true });
                    }

                    proto.Collection.prototype.add.call(this, models, options);
                },

                create: function (model, options) {
                    this.res = options.res;
                    this.req = options.req;
                    this.next = options.next;
                    
                    proto.Collection.prototype.create.call(this, model, options);
                },

                _prepareModel: function (model, options) {
                    options = options || {};

                    if (!(model instanceof Backbone.Model)) {
                        var attrs = model;

                        options.collection = this;

                        model = new this.model(attrs, options);

                        if (!model._validate(model.attributes, options)) {
                            model = false;
                        }

                    } else if (!model.collection) {
                        model.collection = this;
                    }

                    return model;
                }

            }),

            Model: Backbone.Model.extend({

                url: function () {
                    return this.collection.url;
                },
                
                isNew: function() {
                  return !this._id;
                },

                save: function (key, value, options) {
                    var attrs, current;

                    // Handle both `("key", value)` and `({key: value})` -style calls.
                    if (_.isObject(key) || key === null) {
                        attrs = key;
                        options = value;
                    } else {
                        attrs = {};
                        attrs[key] = value;
                    }

                    options = options ? _.clone(options) : {};

                    // If we're "wait"-ing to set changed attributes, validate early.
                    if (options.wait) {
                        if (!this._validate(attrs, options)) return false;
                        current = _.clone(this.attributes);
                    }

                    // Regular saves `set` attributes before persisting to the server.
                    var silentOptions = _.extend({}, options, {silent: true});
                        if (attrs && !this.set(attrs, options.wait ? silentOptions : options)) {
                        return false;
                    }

                    var method = this.isNew() ? 'create' : 'update';
                    var xhr = (this.sync || Backbone.sync).call(this, method, this, options);
                    if (options.wait) this.set(current, silentOptions);
                    return xhr;
                }

            })

        });
    }());
    
    
    // Export the Wishbone object for **Node.js**, with
    // backwards-compatibility for the old `require()` API.
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = Wishbone;
        }
        
        exports._ = _;
    } else {
        root.Wishbone = Wishbone;
    }

}());
