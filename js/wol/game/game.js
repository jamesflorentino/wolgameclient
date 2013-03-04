var HexTiles = require('../tiles/hextiles');

var GameEntity = require('./game-entity');
var Game = function() {
    this.initialize.apply(this, arguments);
};

Game.prototype.entities = null;
Game.prototype._entitiesDict = null;
Game.prototype.tiles = null;

/**
 * @param {Object} options
 */
Game.prototype.initialize = function(options) {
    var columns, rows,
    columns = 10;
    rows = 10;
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

/**
 * @param {GameEntity} gameEntity
 */
Game.prototype.addEntity = function(gameEntity) {
    if (gameEntity instanceof GameEntity) {
        this.entities.push(gameEntity);
        if (gameEntity.id) {
            this._entitiesDict[gameEntity.id] = gameEntity;
        }
    } else {
        throw(new Error('Not a valid GameEntity'));
    }
};

/**
 * @param {Object} attributes
 * @return GameEntity
 */
Game.prototype.createEntity = function(attributes) {
    return new GameEntity(attributes);
};

module.exports = Game;
