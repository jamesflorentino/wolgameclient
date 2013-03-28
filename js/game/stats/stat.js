var Stat = function() {
	this.initialize.apply(this, arguments);
};

/**
 * @type string
 */
Stat.prototype.name = null;

/**
 * @type number
 */
Stat.prototype.value = null;

/**
 * @type number
 */
Stat.prototype.max = null;

/**
 * @method initialize
 * @protected
 * @param {string} name
 * @param {number} value
 */
Stat.prototype.initialize = function(name, value, max) {
	this.name = name;
	this.value = typeof value === 'number' ? value : 0;
	this.max = typeof max === 'number' ? max : this.value;
};

/**
 * Sets the value and the maximum value.
 * @method setBase
 * @param {number} val
 */
Stat.prototype.setBase = function(val) {
	this.value = this.max = val;
};

/**
 * Sets the maximum value
 * @method setMax
 * @param {number} val
 */
Stat.prototype.setMax = function(val) {
	this.max = val;
};


/**
 * Sets the value
 * @method setValue
 * @param {number} val
 * @return {number}
 */
Stat.prototype.setValue = function(val) {
	return this.value = Math.max(Math.min(val, this.max), 0);
};

/**
 * Reduces the value to 0
 * @method empty
 */
Stat.prototype.empty = function() {
	this.value = 0;
};

/**
 * Reduce the value by the value of the argument
 * @param {number} val
 */
Stat.prototype.reduce = function(val) {
	if (val === null || val === undefined) {
		val = 1;
	}
	this.setValue(this.value - val);
};

/**
 * Add value
 * @method increase
 * @param [val=1]
 */
Stat.prototype.increase = function(val) {
	if (typeof val !== 'number') {
		val = 1;
	}
	this.setValue(this.value + val);
};

/**
 * Resets the stat value to its maximum value
 * @method reset
 * @param val
 */
Stat.prototype.reset = function(val) {
	this.value = this.max;
};

/**
 * Gets the ratio of the value from the max value.
 * @method ratio
 * @return {Number}
 */
Stat.prototype.ratio = function() {
	return this.value / this.max;
};

Stat.prototype.val = function() {
	return this.value;
};

module.exports = Stat;
