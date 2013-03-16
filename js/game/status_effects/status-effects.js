var Collection = require('../collection');
var StatusEffect = require('./status-effect');

var StatusEffects = function() {
    this.initialize.apply(this, arguments);
};

StatusEffects.prototype = new Collection();
StatusEffects.prototype.add = function(name) {
};

module.exports = StatusEffects;
