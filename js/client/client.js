/*global createjs */
var Preloader = require('./Preloader');
var HexUtil = require('./hexutil');
var frames = require('./frames/frames');
var settings = require('./settings');
var spriteClasses = {
    marine: require('./unit-classes/marine')
};
var UnitSprite = require('./unit-sprite');
var _ = require('underscore');

var Client = function(game) {
    this.game = game;
    this.units = {};
    this.preloader = new Preloader();
};

Client.prototype.setScene = function(canvas, callback) {
    var _this = this;
    this.layers = {};
    this.stage = new createjs.Stage(canvas);
    _this.resource('background', function(err, backgroundImage){ 

        _this.setSpriteSheets(function(err, spriteSheets) {

            _this.setBackground(backgroundImage, function(err, backgroundLayer) {

                _this.initializeLayers(function(err) {

                    _this.setTiles(_this.game.tiles, function() {

                        _this.setTimers(function(err) {
                            callback();
                        });
                    });
                });
            });
        });
    });
};

Client.prototype.setSpriteSheets = function(callback) {
    this.spriteSheets = {};
    for(var key in frames) {
        if (frames.hasOwnProperty(key)) {
            this.spriteSheets[key] = new createjs.SpriteSheet(frames[key]);
        }
    }
    callback(null, this.spriteSheets);
};

Client.prototype.createSprite = function(name, callback) {
    var animation = new createjs.BitmapAnimation(this.spriteSheets.common);
    animation.gotoAndStop(name);
    callback(null, animation);
};

Client.prototype.createUnit = function(entity, callback) {
    var unit, UnitSpriteClass, _this = this;
    UnitSpriteClass = spriteClasses[entity.type];
    if (UnitSpriteClass) {
        unit = new UnitSpriteClass(entity);
        _this.addUnit(entity.id, unit, function() {
            _this.unitEvents(unit, entity);
            if (entity.tile) {
                _this.moveUnit(unit, entity.tile, function() {
                    callback(null, unit);
                });
            } else {
                callback(null, unit);
            }
        });

    } else {
        callback('Unit Class ' + entity.type + ' is not defined.');
    }
};

Client.prototype.unitEvents = function(unit, entity) {
    var game = this.game,
    _this = this;
    entity.on('move', function(tile, prevTile) {
        var tween = createjs.Tween.get(unit.container);
        unit.prevX = HexUtil.coord(prevTile).x;
        unit.moveStart();
        _this.generateTilePath(
            [prevTile].concat(game.tiles.findPath(prevTile, tile)),
            function(tileSprite, i) {
                if (i) { // Skip the 1st tile since it's the current
                    tween = tween
                        .call(function() { // tell which direction to face
                            if (tileSprite.x > unit.prevX) {
                                unit.face('right');
                            } else {
                                unit.face('left');
                            }
                            unit.prevX = tileSprite.x;
                        })
                        .to({
                            x: tileSprite.x,
                            y: tileSprite.y
                        }, unit.walkDuration);
                }
            }
        );
        tween.call(function() {
            unit.moveEnd();
        });
    });
};

/**
 * Generates a visual path for the unit to walk onto
 * @param {HexTiles} tiles
 * @param {Function} callback
 */
Client.prototype.generateTilePath = function(tiles, callback) {
    var _this = this;
    var tileSprites = [];
    var graphics = new createjs.Graphics();
    var tileSpriteCoordinates = HexUtil.coord(tiles[0]);

    graphics
        .beginStroke('rgba(0,255,255,0.25)')
        .beginFill('cyan')
        .setStrokeStyle(6, 'round');
    _.each(tiles, function(tile, i) {
        /** Generate sprites **/
        _this.createSprite('hex_move', function(err, tileSprite) {
            HexUtil.position(tileSprite, tile);
            _this.layers.tiles.addChild(tileSprite);
            tileSprites.push(tileSprite);
            /** animate **/
            tileSprite.scaleX = 0;
            tileSprite.scaleY = 0;
            createjs.Tween
                .get(tileSprite)
                .wait(i * 60)
                .call(function() {
                    graphics
                        .lineTo(tileSprite.x, tileSprite.y)
                        .drawEllipse(tileSprite.x - 10, tileSprite.y - 5, 20, 10)
                        .moveTo(tileSprite.x, tileSprite.y);
                })
                .to({
                    scaleX: 1,
                    scaleY: 1
                }, 350, createjs.Ease.quintOut);
                if (typeof callback === 'function') {
                    callback(tileSprite, i);
                }
        });
    });
    var linePath = new createjs.Shape(graphics);
    this.layers.tiles.addChild(linePath);
};

Client.prototype.moveUnit = function(unit, tile, callback) {
    var coord = HexUtil.coord(tile, true);
    unit.container.x = coord.x;
    unit.container.y = coord.y;
    callback(null, unit);
};

Client.prototype.addUnit = function(id, unit, callback) {
    this.units[id] = unit;
    this.layers.units.addChild(unit.container);
    callback(null, unit);
};

Client.prototype.getUnit = function(id, callback) {
    callback(null, this.units[id]);
};

Client.prototype.getSpriteSheet = function(name, callback) {
    var spriteSheet = this.spriteSheets[name];
    callback(null, spriteSheet);
};

Client.prototype.setTiles = function(tiles, callback) {
    var _this = this;
    var cacheContainer = new createjs.Container();
    var terrainWidth = HexUtil.WIDTH * settings.columns + (HexUtil.WIDTH * 0.5);
    var terrainHeight = HexUtil.HEIGHT * settings.rows;
    tiles.each(function(tile, i) {
        _this.createSprite('hex_bg', function(err, tileSprite) {
            HexUtil.position(tileSprite, tile);
            cacheContainer.addChild(tileSprite);
        });
    });
    cacheContainer.cache(0, 0, terrainWidth, terrainHeight);
    this.layers.terrain.addChild(cacheContainer);
    this.layers.terrain.addChild(this.layers.tiles); // make sure it's on top :)
    this.layers.terrain.addChild(this.layers.units); // make sure it's on top :)
    this.layers.terrain.y = settings.terrainY;
    callback(tiles);
};

Client.prototype.render = function() {
    this.stage.update();
};

Client.prototype.setTimers = function(callback) {
    //createjs.Ticker.addEventListener('tick', this.render.bind(this));
    createjs.Ticker.addListener(this.render.bind(this));
    createjs.Ticker.setFPS(30);
    callback();
};

Client.prototype.setBackground = function(backgroundImage, callback) {
    this.layers.background = new createjs.Bitmap(backgroundImage);
    this.stage.addChild(this.layers.background);
    callback(null, this.layers.background);
};

Client.prototype.initializeLayers = function(callback) {
    this.layers.terrain = new createjs.Container();
    this.layers.tiles = new createjs.Container();
    this.layers.units = new createjs.Container();
    this.layers.terrain.addChild(this.layers.tiles);
    this.layers.terrain.addChild(this.layers.units);
    this.stage.addChild(this.layers.terrain);
    callback(null);
};

Client.prototype.resource = function(uri, callback) {
    var resource = this.preloader.getResource(uri);
    if (resource) {
        callback(null, resource);
    } else {
        callback(new Error('The resource', uri, 'is not found'));
    }
};

Client.prototype.play = function() {
    createjs.Ticker.setPaused(false);
};

Client.prototype.pause = function() {
    createjs.Ticker.setPaused(true);
};

Client.create = function(game, callback) {
    var client = new Client(game);
    callback(null, client);
};

module.exports = Client;
