var _ = require('underscore');

module.exports = function (prototype, extension) {
    var parent = this,
        child;

    if (prototype && _.has(prototype, 'constructor')) {
        child = prototype.constructor;
    } else {
        child = function () { 
            parent.apply(this, arguments); 
        };
    }

    _.extend(child, parent, extension);

    var Surrogate = function () { 
        this.constructor = child; 
    };

    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate();

    if (prototype) {
        _.extend(child.prototype, prototype);
    }

    child._super_ = parent.prototype;

    return child;
};