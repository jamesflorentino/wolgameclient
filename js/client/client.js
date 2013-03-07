/*global createjs */
var Preloader = require('./Preloader');
var HexUtil = require('./hexutil');
var frames = require('./frames/frames');
var settings = require('./settings');

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
    // get the background resource image
    _this.resource('background', function(err, backgroundImage){ 
        // set the sprite sheet data
        _this.setSpriteSheets(function(err, spriteSheets) {
            // add the background to the stage
            _this.setBackground(backgroundImage, function(err, backgroundLayer) {
                // set the layers needed for organization of sprites
                _this.initializeLayers(function(err) {
                    // set the tiles
                    _this.setTiles(_this.game.tiles, function() {
                        // create the event listeners
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

Client.prototype.addUnit = function(entity, callback) {
    var _this = this;
    if (!this.getUnit(entity.id)) {
        this.getSpriteSheet(entity.type, function(err, spriteSheet) {
            var animation = new createjs.BitmapAnimation(spriteSheet);
            animation.gotoAndPlay('idle');
            _this.layers.units.addChild(animation);
            _this.units[entity.id] = animation;
            // events
            entity.on('move', function(tile) {
                var pos = HexUtil.coord(tile, true);
                animation.x = pos.x;
                animation.y = pos.y;
            });
            callback(null, animation);
        });
    }
};

Client.prototype.getUnit = function(id) {
    return this.units[id];
};

Client.prototype.getSpriteSheet = function(name, callback) {
    var spriteSheet = this.spriteSheets[name];
    callback(null, spriteSheet);
};

Client.prototype.moveEntitySprite = function(sprite, tile) {
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
