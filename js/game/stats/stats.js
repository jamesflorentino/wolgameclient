var Stat = require('./stat');

var Stats = function() {
    this.initialize.apply(this, arguments);
};

/**
 * @type {Array}
 * @private
 */
Stats.prototype.list = null;

/**
 * @type {object}
 * @private
 */
Stats.prototype._dictionary = null;

/**
 * @method initialize
 * @protected
 * @param {object} stats
 */
Stats.prototype.initialize = function(stats) {
    this.list = [];
    this._dictionary = {};
    this.set(stats);
    this.add('null', 0);
};

/**
 * Add an attribute
 * @method add
 * @param {Stat|Object} data
 * @param {String} data2
 */
Stats.prototype.add = function(data, data2) {
    var stat;
    if (data instanceof Stat) {
        stat = data;
    } else if (typeof data === 'object') {
        // { name: 'health', value; 100 }
        if (typeof data.name === 'string' && typeof data.value === 'number') {
            stat = new Stat(data.name, data.value);
        } else {
            // {health: 100}
            this.set(data);
        }
    } else if (typeof data === 'string' && typeof data2 === 'number') {
        // health, 100
        stat = new Stat(data, data2);
    }
    if(stat) {
        this.list.push(stat);
        this._dictionary[stat.name] = stat;
    }
};

/**
 * Override existing stat data.
 * @method set
 * @param {object} stats
 */
Stats.prototype.set = function (stats) {
    var stat;
    var value;
    for (var key in stats) {
        if (stats.hasOwnProperty(key)) {
            value = stats[key];
            if (value.max) {
                value = value.max;
            }
            if ((stat = this.get(key))) {
                stat.setMax(value);
            } else {
                this.add(new Stat(key, value));
            }
        }
    }
};

/**
 * Returns a re-parsed json equivalent.
 * @method toJSON
 * @return {Object}
 */
Stats.prototype.toJSON = function() {
    var attr = {};
    for(var i=0; i<this.list.length;i++) {
        var stat = this.list[i];
        attr[stat.name] = {
            value: stat.value,
            max: stat.max
        };
    }
    return attr;
};

/**
 * returns a Stat Object
 * @method get
 * @param name
 * @return {Stat}
 */
Stats.prototype.get = function(name) {
    var stat = this._dictionary[name];
    if (!stat) {
        stat = this.get('null');
    }
    return stat;
};

module.exports = Stats;
