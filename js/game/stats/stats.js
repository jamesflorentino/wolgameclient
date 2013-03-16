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
Stats.prototype.add = function(name, val, max) {
    var stat = new Stat(name, val, max);
    this.list.push(stat);
    this._dictionary[stat.name] = stat;
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
                stat.setBase(value);
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
Stats.prototype.json = function() {
    var attr = {};
    for(var i=0; i<this.list.length;i++) {
        var stat = this.list[i];
        if (stat.name === 'null') {
            continue;
        }
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

Stats.prototype.each = function(fn) {
    var stat;
    for (var i=0; i < this.list.length; i++) {
        stat = this.list[i];
        if (stat.name === 'null') {
            continue;
        }
        if (fn(stat, i) === false) {
            break;
        }
    };
};

module.exports = Stats;
