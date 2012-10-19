var _ = require('underscore'),
    mongo = require('mongodb');
    
module.exports = function (options) {
    var defaults = {
        hostname: 'localhost',
        port: 27017,
        db: 'test',
        username: '',
        password: ''
    };
    
    options = _.extend(defaults, options);
    
    var server = new mongo.Server(options.hostname, options.port, { auto_reconnect : true });
    
    return new mongo.Db(options.db, server, { safe : false });
};