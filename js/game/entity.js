var Stats = require('./stats/stats');
var Commands = require('./commands/commands');
var EventEmitter = require('events').EventEmitter;

var GameEntity = function() {
    this.initialize.apply(this, arguments);
};

GameEntity.prototype = new EventEmitter();

GameEntity.prototype.id = null;
GameEntity.prototype.type = null;
GameEntity.prototype.stats = null;
GameEntity.prototype.commands = null;

GameEntity.prototype.initialize = function(id) {
    this.id = id;
    this.stats = new Stats();
    this.stats.add('health', 100);
    this.stats.add('damage', 10);
    this.stats.add('defense', 10);
    this.stats.add('range', 1);
    this.stats.add('splash', 0);
    this.commands = new Commands();
    this.tile = null;
};

GameEntity.prototype.set = function(attributes) {
    if (typeof attributes === 'object') {
        if (attributes.hasOwnProperty('commands')) {
            this.commands.set(attributes.commands);
        }
        if (attributes.hasOwnProperty('stats')) {
            this.stats.set(attributes.stats);
        }
    }
};

GameEntity.prototype.move = function(tile, callback) {
    var prevTile = this.tile;
    this.prevTile = this.tile;
    this.tile = tile;
    this.emit('move:start', tile);
    if (prevTile) {
        prevTile.vacate(this);
    }
    tile.occupy(this);
    if (typeof callback === 'function') {
        callback(tile);
    }
};

GameEntity.prototype.damage = function(damage) {
    this.stats.get('health').reduce(damage);
    this.emit('damage', damage);
};

GameEntity.prototype.enable = function() {
    this.emit('enable');
};

GameEntity.prototype.disable = function() {
    this.emit('disable');
};

GameEntity.prototype.die = function() {
    this.emit('die');
};

GameEntity.prototype.calculateDamage = function(inputDamage, options) {
    var outputDamage = inputDamage + 0;
    var health = this.stats.get('health').val();
    return outputDamage;
};

GameEntity.create = function(id, fn) {
    var entity = new GameEntity(id);
    if (typeof fn === 'function') {
        fn(entity);
    }
    return entity;
};

module.exports = GameEntity;
