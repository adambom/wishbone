var mongo = require('mongodb');

var Crud = function (name, db) {
    var self = this;
    
    db.collection(name, function(err, collection) {
        self.collection = collection;
    });
};

var safe = { safe : true };

Crud.prototype.create = function (doc, cb) {
    var code = '201';
    
    doc._id = new mongo.ObjectID();
    
    this.collection.insert(doc);
    
    cb(code, doc);
};

Crud.prototype.read = function (id, cb) {
    var code = '200';
    
    var onComplete = function (err, items) {
        if (err) {
            code = '500';
        }
        
        cb(code, items);
    };
    
    if (id) {
        this.collection.findOne({ _id : id }, onComplete);
    } else {
        // TODO: Stream records rather than load them all using toArray
        this.collection.find().toArray(onComplete);
    }
    
};

Crud.prototype.update = function (id, doc, cb) {
    var code = '201';
    
    id = new mongo.ObjectID(id);
    
    this.collection.update({ _id : id }, { $set : doc }, true);
    
    cb(code, doc);
};

Crud.prototype.delete = function (id, cb) {
    var code = '201';
    
    if (id) {
        id = new mongo.ObjectID(id);
    }

    if (id) {
        this.collection.remove({ _id : id });
    } else {
        this.collection.remove();
    }
    
    cb(code);
    
};

module.exports = Crud;