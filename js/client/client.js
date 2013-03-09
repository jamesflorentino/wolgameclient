/*global createjs */
var Preloader = require('./Preloader');
var HexUtil = require('./hexutil');
var frames = require('./frames/frames');
var settings = require('./settings');
var spriteClasses = {
    marine: require('./unit-classes/marine')
}

var Client = function(game) {
    this.game = game;
    this.units = {};
    this.preloader = new Preloader();
};

/**
 * @param {Function} callback
 */
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
    var UnitSpriteClass = spriteClasses[entity.type];
    console.log(UnitSpriteClass);
};

Client.prototype.getUnit = function(id) {
    return this.units[id];
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

/**
 * @param {String} uri
 * @param {Function} callback
 */
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

/**
 * @param {Game} game
 * @param {Function} callback
 */
Client.create = function(game, callback) {
    var client = new Client(game);
    callback(null, client);
};



module.exports = Client;
