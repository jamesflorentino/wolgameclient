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
 * How far the command can reach
 * @type {Number}
 */
Command.prototype.reach = null;

/**
 * The range of the command's affected area
 * @type {Number}
 */
Command.prototype.splash = null;

/**
 * @param {String} id
 * @param {Number} damage
 * @param {Number} reach
 * @param {Object} [options]
 */
Command.prototype.initialize = function(id, damage, reach, options) {
    this.id = id;
    this.damage = damage;
    this.reach = reach;
    if (typeof options === 'object') {
        if (options.hasOwnProperty('splash')) {
            this.splash = options.splash;
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
