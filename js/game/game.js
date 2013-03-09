var HexTiles = require('./tiles/hextiles');
var EventEmitter = require('events').EventEmitter;
var GameEntity = require('./entity');

var Game = function() {
    this.initialize.apply(this, arguments);
};

Game.prototype = new EventEmitter();

Game.prototype.initialize = function(options) {
    var columns, rows,
    columns = 0;
    rows = 0;
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
    var entity = new GameEntity(attributes);
    var tile;
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
    callback(null, entity);
};

Game.prototype.getTile = function(coord, callback) {
    var tile = this.tiles.get(coord.x, coord.y);
    if (tile) {
        callback(null, tile);
    } else {
        callback('Tile is invalid');
    }
};

Game.create = function(options, callback) {
    callback(null, new Game(options));
};

module.exports = Game;
