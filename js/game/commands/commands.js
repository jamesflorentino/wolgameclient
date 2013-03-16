var Command = require('./command');
var Collection = require('../collection');

var Commands = function() {
    this.initialize.apply(this, arguments);
};

Commands.prototype = new Collection();
Commands.prototype.__super = Collection.prototype;

Commands.prototype.initialize = function(data) {
    this.set.apply(this, arguments);
    this.__super.initialize.apply(this);
};

Commands.prototype.get = function(id, fn) {
    var command = this.__super.get.apply(this, arguments);
    if (typeof fn === 'function') {
        if (command) {
            fn(command);
        }
    }
    return command;
};

Commands.prototype.set = function(data) {
    if (typeof data === 'object') {
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                this.add(key, data[key]);
            }
        }
    }

};

Commands.prototype.add = function(name, options) {
    var command = new Command(name, options);
    this.__super.add.call(this, command);
};

module.exports = Commands;
