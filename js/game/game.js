var HexTiles = require('./tiles/hextiles');
var EventEmitter = require('events').EventEmitter;
var GameEntity = require('./entity');
var Tile = require('./tiles/tile');
var _ = require('underscore');

var Game = function() {
    this.initialize.apply(this, arguments);
};

Game.rows = 8;
Game.columns = 10;

Game.prototype = new EventEmitter();

Game.prototype.initialize = function() {
    this.entities = [];
    this._entitiesDict = {};
    this.tiles = new HexTiles(Game.columns, Game.rows);
};

Game.prototype.addEntity = function(entity) {
    if (entity instanceof GameEntity) {
        if (entity.id) {
            this._entitiesDict[entity.id] = entity;
            this.entities.push(entity);
            this.emit('unit:add', entity);
        } else {
            throw(new Error('GameEntity requires an ID'));
        }
    } else {
        throw(new Error('Not a valid GameEntity'));
    }
};

Game.prototype.removeEntity = function(entity) {
    var tile = entity.tile;
    tile.vacate(entity);
    delete this._entitiesDict[entity.id];
    this.entities.splice(this.entities.indexOf(entity), 1);
    this.emit('unit:remove', entity);
    entity.die();
};

Game.prototype.createEntity = function(id, callback) {
    var entity = GameEntity.create(id);
    if (typeof callback === 'function') {
        callback(entity);
    }
    return entity;
};

Game.prototype.getEntity = function(id, callback) {
    var entity = this._entitiesDict[id];

    if (typeof callback === 'function') {
        if (entity) {
            callback(null, entity);
        }
    }

    return entity;
};

Game.prototype.eachEntity = function(callback) {
    _.each(this.entities, callback);
};

Game.prototype.act = function(entity, tile) {
    if (entity instanceof GameEntity && tile instanceof Tile) {
        // steps:
        // 1. Determine the type of attack the unit will need to do
    }
};

/** Turn based component **/
Game.prototype.setTurn = function(entity) {
    if (this.entities.indexOf(entity) > -1) {
        this.currentTurn = entity;
    }
};

Game.prototype.endTurn = function() {
    this.currentTurn = null;
};

Game.create = function(callback) {
    var game = new Game();
    if (typeof callback === 'function') {
        callback(null, game);
    }
    return game;
};


module.exports = Game;
