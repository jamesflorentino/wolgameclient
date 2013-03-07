var HexTiles = require('./tiles/hextiles');

var GameEntity = require('./entity');
var Game = function() {
    this.initialize.apply(this, arguments);
};


/**
 * @param {Object} options
 */
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
 */
Game.prototype.createEntity = function(attributes, callback) {
    var entity = new GameEntity(attributes);
    this.addEntity(entity);
    callback(null, entity);
};

Game.prototype.getEntity = function(id) {
    return this._entitiesDict[gameEntity.id];
};

Game.create = function(options, callback) {
    callback(null, new Game(options));
};

module.exports = Game;
