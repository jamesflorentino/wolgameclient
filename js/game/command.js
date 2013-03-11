var Command = function() {
    this.initialize.apply(this, arguments);
};

/**
 * @param {Object} data
 */
Command.prototype.initialize = function(data) {
    this.targets = [];
    this.damage = 0;
    if (typeof data === 'object') {
        if (data.hasOwnProperty('targets')) {
            this.targets = data.targets;
        }
    }
};

Command.prototype.eachTarget = function(callback) {
    for (var i=0; i < this.targets.length; i++) {
        callback(this.targets[i], i);
    }
};

Command.create = function(data) {
    return new Command(data);
};

module.exports = Command;
