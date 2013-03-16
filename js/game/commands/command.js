var Command = function() {
    this.initialize.apply(this, arguments);
};

/**
 * Identifier for the command
 * @type {String}
 */
Command.prototype.id = null;

/**
 * Base value for the damage
 * @type {Number}
 */
Command.prototype.damage = null;

/**
 * How far the command can range
 * @type {Number}
 */
Command.prototype.range = null;

/**
 * The range of the command's affected area
 * @type {Number}
 */
Command.prototype.splash = null;

/**
 * @param {String} id
 * @param {Number} damage
 * @param {Number} range
 * @param {Object} [options]
 */
Command.prototype.initialize = function(id, options) {
    if (id === null) {
        throw new Error('command id is required');
    }
    this.id = id;
    this.cooldown = 0;
    this.damage = 0;
    this.range = 0;
    this.splash = 0;
    if (typeof options === 'object') {
        for(var key in options) {
            if (options.hasOwnProperty(key)) {
                this[key] = options[key];
            }
        }
    }
};

Command.prototype.set = function(data) {
    for(var key in data) {
        if (data.hasOwnProperty(key)) {
            this[key] = data[key];
        }
    }
};

Command.create = function(data, callback) {
    var command = new Command();
    command.set(data);
    callback(null, command);
};

module.exports = Command;
