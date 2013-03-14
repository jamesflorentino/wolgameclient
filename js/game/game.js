var HexTiles = require('./tiles/hextiles');
var EventEmitter = require('events').EventEmitter;
var GameEntity = require('./entity');
var Tile = require('./tiles/tile');
var unitsAttributes = require('./unit-settings');
var _ = require('underscore');

var setEntityAttributes = function(entity) {
	var attributes = unitsAttributes[entity.type];
	if (attributes) {
		entity.stats.set(attributes.stats);
	}
};

var Game = function() {
	this.initialize.apply(this, arguments);
};

Game.prototype = new EventEmitter();

Game.prototype.initialize = function(options) {
	var columns = 0, rows = 0;
	if (typeof options === 'object') {
		if (options.columns) {
			columns = options.columns;
		}
		if (options.rows) {
			rows = options.rows;
		}
	}
	this.entities = [];
	this._entitiesDict = {};
	this.tiles = new HexTiles(columns, rows);
};

Game.prototype.addEntity = function(gameEntity) {
	if (gameEntity instanceof GameEntity) {
		if (gameEntity.id) {
			this._entitiesDict[gameEntity.id] = gameEntity;
			this.entities.push(gameEntity);
		} else {
			throw(new Error('GameEntity requires an ID'));
		}
	} else {
		throw(new Error('Not a valid GameEntity'));
	}
};


Game.prototype.createEntity = function(attributes, callback) {
	var entity, tile;
	entity = new GameEntity(attributes);
	setEntityAttributes(entity);
	if (attributes.hasOwnProperty('x') && attributes.hasOwnProperty('y')) {
		tile = this.tiles.get(attributes.x, attributes.y);
		entity.move(tile, function() {
			callback(null, entity);
		});
	} else {
		callback(null, entity);
	}
	this.addEntity(entity);
	this.emit('unit:spawn',  entity);
};

Game.prototype.getEntity = function(id, callback) {
	var entity = this._entitiesDict[id];
	if (!entity) {
		callback({ error: 'entity is undefined', id: id });
	} else {
		callback(null, entity);
	}
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

Game.create = function(options, callback) {
	callback(null, new Game(options));
};

module.exports = Game;
