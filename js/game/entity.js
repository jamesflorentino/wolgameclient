var Stats = require('./stats/stats');
var EventEmitter = require('events').EventEmitter;
var Command = require('./command');

var GameEntity = function() {
    this.initialize.apply(this, arguments);
};

GameEntity.prototype = new EventEmitter();

GameEntity.prototype.initialize = function(options) {
    if (typeof options === 'object') {
        this.id = options.id;
        this.type = options.type;
    }
    this.stats = new Stats();
    this.stats.add('health', 100);
    this.stats.add('damage', 10);
    this.stats.add('defense', 10);
    this.stats.add('range', 1);
    this.stats.add('reach', 1);
    this.tile = null;
};

GameEntity.prototype.move = function(tile, callback) {
    var prevTile = this.tile;
    this.prevTile = this.tile;
    this.tile = tile;
    this.emit('move:start', tile, prevTile);
    if (prevTile) {
        prevTile.vacate(this);
    }
    tile.occupy(this);
    if (typeof callback === 'function') {
        callback(tile, prevTile);
    }
};

GameEntity.prototype.act = function(command) {
    var health;
    if (command instanceof Command) {
        command.eachTarget(function(target) {
            target.entity.damage(target.damage);
        });
        this.emit('act', command);
    }
};

GameEntity.prototype.damage = function(damage) {
    this.stats.get('health').reduce(damage);
    this.emit('damage', damage);
};

GameEntity.prototype.turn = function() {
    this.emit('turn');
};

module.exports = GameEntity;
