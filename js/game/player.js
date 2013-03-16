var EventEmitter = require('events').EventEmitter;

var Player = function() {
    this.initialize.apply(this, arguments);
};

Player.prototype = new EventEmitter();

Player.prototype.id = null;

Player.prototype.name = null;

Player.prototype.initialize = function(id) {
    this.id = id;
};

Player.create = function(id, fn) {
    var player = new Player(id);
    if (typeof fn === 'function') {
        callback(player);
    }
    return player;
};

module.exports = Player;
