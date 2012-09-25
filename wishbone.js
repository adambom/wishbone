(function () {
    var _ = require('underscore'),
        Backbone = require('backbone'),
        mongo = require('mongodb'),
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

                mongo.connect(url, function (err, conn) {

                    conn.collection(that.collection.name, function (err, coll) {

                        coll.insert(that.toJSON(), onComplete);

                    });

                });
            },

            update: function (url) {
                var that = this,
                    id = this.id;

                mongo.connect(url, function (err, conn) {

                    conn.collection(that.get('name'), function (err, coll) {

                        if (id) {
                            coll.update({ '_id' : new ObjectID(id) }, that.toJSON());
                        }

                    });

                });
            },

            "delete": function (url) {
                var that = this,
                    id = this.id;

                mongo.connect(url, function (err, conn) {

                    conn.collection(that.get('name'), function (err, coll) {
                        coll.remove({ '_id' : id });
                    });

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

                mongo.connect(url, function (err, conn) {

                    conn.collection(name, function (err, coll) {

                        if (id) {

                            coll.findOne({ '_id' : new ObjectID(id) }, onRead);

                        } else {

                            coll.find().toArray(onRead);

                        }

                    });

                });
            }

        };

        Router.extend = extend;
        var proto = $.extend(true, {}, Backbone);

        return _.extend(Backbone, {

            sync: function (method, collection, options) {
                method = _.bind(methodMap[method], this);

                options = options || (options = {});

                var url = options.url || getValue(collection, 'url') || urlError();

                method(url, options);
            },

            Router: Router,

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
