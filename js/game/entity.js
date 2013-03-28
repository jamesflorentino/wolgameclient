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
    this.data = {};
    this.stats = new Stats();
    // hit points
    this.stats.add('health', 800, 800);
    // armor points
    this.stats.add('defense', 0);
    // range
    this.stats.add('range', 1, 1);
    // how fast their turn gauge fill ups
    this.stats.add('turnspeed', 1);
    // turn points
    this.stats.add('turn', 0, 10);
    // actions
    this.stats.add('actions', 0, 5);
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
        if (attributes.hasOwnProperty('data')) {
            this.data = attributes.data;
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

GameEntity.prototype.isDead = function() {
    return this.stats.get('health').val() === 0;
};

/**
 * The index parameter will be the basis for the splash damage calculation
 * @param {GameEntity} target entity
 * @param {Command} command target comand
 * @param {Number} index
 */
GameEntity.prototype.act = function(target, command, index) {
    var health, defense, damage, status, tile;
    health = target.stats.get('health').val();
    defense = target.stats.get('defense').val();
    damage = command.damage;

    /** target defense bonuses **/
    if (typeof target.tile.defense === 'number') {
        defense += target.tile.defense;
    }

    /** entity attack bonuses **/
    if (typeof this.tile.attack === 'number') {
        damage += this.tile.attack;
    }

    // apply splash index bonuses
    damage = index > 0 ? damage * 0.5 : damage;
    damage = Math.max(0, damage - defense);
    status = 'damage';

    if (health - damage <= 0) {
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
