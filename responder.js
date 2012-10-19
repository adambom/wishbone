var Backbone = require('backbone'),
    _ = require('underscore');

module.exports = Backbone.Model.extend({
    
    initialize: function () {
        this.on('200', this['200']);
        this.on('201', this['201']);
        this.on('404', this['404']);
        this.on('500', this['500']);
    },
    
    // GET
    '200': function (response) {
        this.get('res').end(JSON.stringify(response));
    },
    
    // PUT, POST
    '201': function (response) {
        this.get('res').end(JSON.stringify(response));
    },
    
    // Not Found
    '404': function (error) {
        this.get('res').end(JSON.stringify(error));
    },
    
    // Internal Server Error
    '500': function (error) {
        this.get('res').end(JSON.stringify(error));
    }
    
    
});