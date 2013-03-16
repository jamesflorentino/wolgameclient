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
GameEntity.prototype.state = null;

GameEntity.prototype.initialize = function(id) {
    this.id = id;
    this.stats = new Stats();
    this.stats.add('health', 100, 100);
    this.stats.add('damage', 10, 10);
    this.stats.add('defense', 10, 10);
    this.stats.add('range', 1, 1);
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

GameEntity.prototype.move = function(tile, sync) {
    var prevTile = this.tile;
    this.prevTile = this.tile;
    this.tile = tile;
	if (sync) {
		this.emit('move:update', tile);
	} else {
		this.emit('move:start', tile);
	}

    if (prevTile) {
        prevTile.vacate(this);
    }
    tile.occupy(this);
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

GameEntity.prototype.act = function(target, command) {
    var health = target.stats.get('health').val();
    var defense = target.stats.get('defense').val();
    var damage = Math.max(0, command.damage - defense);
    var status;
    if (health - damage < 0) {
        status = 'death';
    }
	this.emit('act', {
		target: target,
		command: command
	});
    return {
        damage: damage,
        status: status
    };
};

GameEntity.create = function(id, fn) {
    var entity = new GameEntity(id);
    if (typeof fn === 'function') {
        fn(entity);
    }
    return entity;
};

module.exports = GameEntity;
