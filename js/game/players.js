var Collection = require('./collection');

var Players = function() {
    this.initialize.apply(this, arguments);
};

Players.prototype = new Collection();

module.exports = Players;
