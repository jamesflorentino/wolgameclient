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

Game.prototype.createEntity = function(options, callback) {
    var entity = GameEntity.create(options.id);
    if (entity) {
        if (options) {
            entity.type = options.type;
            entity.set(options.attributes);
        }
        if (typeof callback === 'function') {
            callback(entity);
        }
    }
    return entity;
};

Game.prototype.spawnEntity = function(options, fn) {
    var _this = this;
    this.createEntity(options, function(entity) {
        _this.tiles.get(options.x, options.y, function(tile) {
            entity.move(tile);
            _this.addEntity(entity);
            if (typeof fn === 'function') {
                fn(entity);
            }
        });
    });
};

Game.prototype.moveEntity = function(entity, tile, sync) {
    entity.move(tile, sync);
    this.emit('unit:move', entity, sync);
};

Game.prototype.getEntity = function(id, callback) {
    var entity = this._entitiesDict[id];

    if (typeof callback === 'function') {
        if (entity) {
            callback(entity);
        }
    }
    return entity;
};

Game.prototype.eachEntity = function(callback) {
    _.each(this.entities, callback);
};

Game.prototype.loadMap = function(tiles) {
    var _this = this;
    _.each(tiles, function(t) {
        _this.tiles.get(t.x, t.y, function(tile) {
            for(var key in t) {
                if (t.hasOwnProperty(key)) {
                    tile[key] = t[key];
                }
            }
        });
    });
};


Game.prototype.actEntity = function(entity, tile, command, target) {
    var _this = this;
    var attackRange = command.range;
    var splashRange = command.splash;
    var targets = [];
    var results = [];
    var tiles;
    var p = tile;

    // get the affected units
    tiles = this.tiles.neighbors(tile, splashRange);
    tiles = [tile].concat(tiles);
    tiles = _.filter(tiles, function(tile) {
        return tile.entities.length > 0 && !tile.has(entity);
    });

    _.each(tiles, function(tile, i) { // Subsequent damage chains of the tiles shouldn't be as high as the targetted unit
        var target, result;
        target = tile.entities[0];
        if (target.stats.get('health').val() > 0) {
            result = entity.act(target, command, i);
            target.damage(result.damage);
            targets.push({
                id: target.id,
                damage: result.damage
            });

            if (result.status) {
                results.push({
                    id: target.id,
                    status: result.status
                });
            }
        }

    });

    this.emit('unit:act', {
        id: entity.id,
        x: tile.x,
        y: tile.y,
        type: command.id,
        targets: targets,
        results: results
    });
};

/** Turn based component **/
Game.prototype.setTurn = function(entity) {
    if (this.entities.indexOf(entity) > -1) {
        this.currentTurn = entity;
        entity.enable();
        this.emit('unit:enable', entity);
    }
};

Game.prototype.endTurn = function() {
    var entity = this.currentTurn;
    if (entity) {
        entity.disable();
        this.emit('unit:disable', entity);
    }
    this.currentTurn = null;
};

Game.prototype.nextTurn = function() {
    this.endTurn();
};

Game.create = function(callback) {
    var game = new Game();
    if (typeof callback === 'function') {
        callback(null, game);
    }
    return game;
};


module.exports = Game;
