var StatModifers = function() {
	this.initialize.apply(this, arguments);
};


StatModifers.prototype.initialize = function () {
	this.modifiers = [];
	this._dictionary = {};
};

StatModifers.prototype.add = function(modifier) {
	if (this.modifiers.indexOf(modifier) === -1) {
		this.modifiers.push(modifier);
		this._dictionary[modifier.id] = modifier;
	}
};
