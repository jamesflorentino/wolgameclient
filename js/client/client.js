/*global createjs */
var Preloader = require('./Preloader');
var HexUtil = require('./hexutil');
var frames = require('./frames/frames');
var settings = require('./settings');
var EventEmitter = require('events').EventEmitter;
var spriteClasses = {
    marine: require('./unit-classes/marine'),
    vanguard: require('./unit-classes/vanguard')
};
var UnitSprite = require('./unit-sprite');
var _ = require('underscore');
var Ease = createjs.Ease;
var Tween = createjs.Tween;

var Client = function(game) {
    this.game = game;
    this.units = {};
    this.preloader = new Preloader();
};

Client.prototype = new EventEmitter();

Client.prototype.setScene = function(canvas, callback) {
    var _this = this;
    this.layers = {};
    this.stage = new createjs.Stage(canvas);
    createjs.Touch.enable(this.stage);
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
            _this.unitInput(unit, entity);
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

Client.prototype.unitInput = function(unit, entity) {
    var _this = this;
    this.createSprite('unit-shadow', function(err, shadow) {
        shadow.regX = HexUtil.WIDTH * 0.5;
        shadow.regY = HexUtil.HEIGHT * 0.5 - 2;
        unit.container.addChildAt(shadow, 0);
        shadow.addEventListener('click', function() {
            unit.emit('input:select');
        });
    });
};

Client.prototype.unitEvents = function(unit, entity) {
    var game = this.game,
    _this = this;

    entity.on('act', function unitAct(command) {
        var targetUnits = [];
        var tileSprites = [];
        // pool the sprite equivalent of the target entities
        (function() {
            command.eachTarget(function(target) {
                _this.getUnit(target.entity.id, function(err, targetUnit) {
                    targetUnits.push(targetUnit);
                });
            });
        })();
        // Make sure they're all clean
        unit.removeAllListeners('act:end');
        unit.removeAllListeners('act');

        unit.on('act:end', function() {
            unit.removeAllListeners('act:end');
            unit.removeAllListeners('act');
            command.eachTarget(function(target) {
                var entity = target.entity;
                var damage = target.damage;
                _this.getUnit(entity.id, function(err, targetUnit) {
                    _this.showDamage(targetUnit, damage);
                    if (target.entity.stats.get('health').value === 0) {
                        targetUnit.die();
                    } else {
                        targetUnit.damageEnd();
                    }
                });
            });
            _.each(tileSprites, function(tileSprite) {
                tileSprite.parent.removeChild(tileSprite);
            });
        });

        unit.on('act', function(damage) {
            _.each(targetUnits, function(targetUnit) {
                targetUnit.damage();
            });
        });

        unit.actStart(command);
        command.eachTarget(function(target) {
            _this.getUnit(target.entity.id, function(err, targetUnit) {
                _this.createTile('hex_target', target.entity.tile, function(err, tileSprite) {
                    tileSprites.push(tileSprite);
                });
                targetUnit.damageStart();
            });
        });
    });

    entity.on('turn', function unitTurn() {
        _this.createSprite('hex_active', function(err, sprite) {
            sprite.set({
                regX: HexUtil.WIDTH * 0.5 + 5,
                regY: HexUtil.HEIGHT * 0.5,
                scaleX: 0,
                scaleY: 0,
                alpha: 0
            })
            unit.container.addChildAt(sprite, 0);
            Tween.get(sprite)
                .to({
                    scaleX: 1,
                    scaleY: 1,
                    alpha: 1
                }, 450, Ease.backInOut);
        });
        //_this.createTile('hex_active', entity.tile, function(err, tileSprite) {
        //    tileSprite.regX = 46;
        //});
    });

    entity.on('move:start', function moveStart(tile, prevTile) {
        var tween = Tween.get(unit.container);
        var path = game.tiles.findPath(prevTile, tile);
        unit.prevX = HexUtil.coord(prevTile).x;
        unit.moveStart();
        var tilePathObject = _this.generateTilePath(
            [prevTile].concat(path),
            function(tileSprite, i, prevTileSprite, tile) {
                if (i) { // Skip the 1st tile since it's the current
                    var walkDuration =
                        tileSprite.y !== (prevTileSprite ? prevTileSprite.y : tileSprite.y) ?
                        unit.walkDuration * 0.75 :
                        unit.walkDuration;
                    tween = tween
                        .call(function() { // tell which direction to face
                            if (tileSprite.x > unit.prevX) {
                                unit.face('right');
                            } else {
                                unit.face('left');
                            }
                            unit.prevX = tileSprite.x;
                            unit.prevY = tileSprite.y;
                            unit.move(tile);
                        })
                        .to({
                            x: tileSprite.x,
                            y: tileSprite.y
                        }, walkDuration);
                }
            }
        );
        tween.call(function() {
            var linePath = tilePathObject.linePath;
            var tileSprites = tilePathObject.tileSprites;
            _.each(tileSprites, function(tileSprite, i) {
                Tween.get(tileSprite).wait(i * 100)
                .to({
                    scaleX: 0,
                    scaleY: 0
                }, 250, Ease.backIn)
                .call(function() {
                    tileSprite.parent.removeChild(tileSprite);
                });
            });
            Tween
                .get(linePath)
                .wait(105 * tileSprites.length)
                .to({
                    alpha: 0
                }, 150)
                .call(function() {
                    linePath.parent.removeChild(linePath);
                });
            unit.moveEnd();
        });
    });

    unit.on('move', function sortUnits(tile) {
        var index = 0;
        game.eachEntity(function(_entity, i) {
            if (tile.z >= _entity.tile.z) {
                index = i;
            }
        });
        var container = unit.container;
        var entityIndex = index;
        var unitIndex = container.parent.getChildIndex(container);

        if (entityIndex !== unitIndex) {
            container.parent.addChildAt(container, entityIndex);
        }
    });

    unit.on('input:select', function inputSelect() {
        if (_this.game.currentTurn === entity) {
            unit.emit('show:movetiles');
        } else {
            console.log('nope');
        }
    });

    unit.on('show:movetiles', function() {
        var moveTiles, actTiles;
        if (unit.tileSprites) {
            unit.emit('hide:all');
        } else {
            unit.tileSprites = [];
            moveTiles = _.filter(game.tiles.neighbors(entity.tile, entity.stats.get('range').value), function(tile) {
                return tile.entities.length === 0;
            });
            actTiles = _.filter(game.tiles.neighbors(entity.tile, entity.stats.get('reach').value), function(tile) {
               return tile.entities.length > 0;
            });

            // show moveable tiles
            _this.createTiles('hex_move', moveTiles, function(err, tileSprite, tile, i) {
                tileSprite.addEventListener('click', function(e) {
                    var tiles, pathSpriteObject, lastTile;
                    tiles = [entity.tile].concat(game.tiles.findPath(entity.tile, tile));
                    unit.emit('hide:pathtiles');
                    pathSpriteObject = _this.generateTilePath(tiles, function(tileSprite, i, prevTileSprite, tile) {
                    });
                    lastTile = pathSpriteObject.tileSprites[pathSpriteObject.tileSprites.length - 1];
                    lastTile.addEventListener('click', function() {
                        _this.emit('input:movetile', {
                            tile: tile,
                            entity: entity
                        });
                        unit.emit('hide:all');
                    });
                    unit.tileSpritePaths = [].concat(pathSpriteObject.tileSprites).concat(pathSpriteObject.linePath);
                });
                unit.tileSprites.push(tileSprite);
                tileSprite.set({
                    scaleX: 0,
                    scaleY: 0,
                    alpha: 0
                });
                Tween.get(tileSprite)
                    .wait(i * 30)
                    .to({
                        scaleX: 1,
                        scaleY: 1,
                        alpha: 1
                    }, 400, Ease.backOut);
            });

            // show attackable tiles
            _this.createTiles('hex_target', actTiles, function(err, tileSprite, tile, i) {
                unit.tileSprites.push(tileSprite);
                tileSprite.addEventListener('click', function() {
                    _this.emit('input:acttile', function() {

                    });
                });
                tileSprite.set({
                    scaleX: 0,
                    scaleY: 0,
                    alpha: 0
                });
                Tween.get(tileSprite)
                .wait(i * 50)
                .to({
                    scaleX: 1,
                    scaleY: 1,
                    alpha: 1
                }, 550, Ease.backOut);
            });
        }
    });

    unit.on('hide:pathtiles', function() {
        var tiles = unit.tileSpritePaths;
        if (tiles) {
            _this.layers.tiles.removeChild.apply(_this.layers.tiles, tiles);
            delete unit.tileSpritePaths;
        }
    });

    unit.on('hide:all', function() {
        unit.emit('hide:pathtiles');
        unit.emit('hide:movetiles');
    });

    unit.on('hide:movetiles', function() {
        if (unit.tileSprites) {
            _this.layers.tiles.removeChild.apply(_this.layers.tiles, unit.tileSprites);
            delete unit.tileSprites;
        }
    });
};

Client.prototype.showDamage = function(unit, damage) {
    var _this = this;
    var spacing = 0;
    _.each(String(damage).split(''), function(numeral, i) {
        _this.createSprite('n-' + numeral, function(err, sprite) {
            var posX = unit.container.x + spacing * 0.6;
            var posY = unit.container.y - 50;
            spacing += settings.numberSpacing[numeral];
            sprite.x = posX;
            sprite.y = posY - 50;
            sprite.alpha = 0;
            _this.layers.terrain.addChild(sprite);
            Tween.get(sprite)
                .wait(i * 80)
                .to({
                    y: posY,
                    alpha: 1
                }, 800, Ease.backInOut)
                .wait(2000)
                .to({
                    y: posY + 20,
                    alpha: 0
                }, 500, Ease.quartIn)
                .call(function() {
                    sprite.parent.removeChild(sprite);
                });
        });
    });
};

Client.prototype.createTiles = function(name, tiles, callback) {
    var _this = this;
    _.each(tiles, function(tile, i) {
        _this.createSprite(name, function(err, tileSprite) {
            HexUtil.position(tileSprite, tile);
            _this.layers.tiles.addChild(tileSprite);
            callback(null, tileSprite, tile, i);
        });
    });
};

Client.prototype.createTile = function(name, tile, callback) {
    var _this = this;
    _this.createSprite(name, function(err, tileSprite) {
        HexUtil.position(tileSprite, tile);
        _this.layers.tiles.addChild(tileSprite);
        callback(null, tileSprite);
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

    var linePath = new createjs.Shape(graphics);

    graphics
        .beginStroke('rgba(0,255,255,0.25)')
        .beginFill('cyan')
        .setStrokeStyle(6, 'round');
    _.each(tiles, function(tile, i) {
        /** Generate sprites **/
        _this.createSprite('hex_move_select', function(err, tileSprite) {
            HexUtil.position(tileSprite, tile);
            _this.layers.tiles.addChild(tileSprite);
            tileSprites.push(tileSprite);
            graphics
                .lineTo(tileSprite.x, tileSprite.y)
                .drawEllipse(tileSprite.x - 10, tileSprite.y - 5, 20, 10)
                .moveTo(tileSprite.x, tileSprite.y);
            /** animate **/
            tileSprite.scaleX = 0;
            tileSprite.scaleY = 0;
            Tween
                .get(tileSprite)
                .wait(i * 80)
                .to({
                    scaleX: 1,
                    scaleY: 1
                }, 350, Ease.backOut);
                if (typeof callback === 'function') {
                    callback(tileSprite, i, tileSprites[i-1], tile);
                }
        });
    });
    this.layers.tiles.addChild(linePath);
    return {
        tileSprites: tileSprites,
        linePath: linePath
    };
};

Client.prototype.moveUnit = function(unit, tile, callback) {
    var coord = HexUtil.coord(tile, true);
    unit.container.x = coord.x;
    unit.container.y = coord.y;
    unit.emit('move', tile);
    callback(null, unit);
};

Client.prototype.addUnit = function(id, unit, callback) {
    this.units[id] = unit;
    this.layers.units.addChild(unit.container);
    callback(null, unit);
};

Client.prototype.getUnit = function(id, callback) {
    var unit = this.units[id];
    if (unit) {
        callback(null, unit);
    }
    return unit;
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
        _this.createSprite('hex_bg_inset', function(err, tileSprite) {
            HexUtil.position(tileSprite, tile);
            cacheContainer.addChild(tileSprite);
        });
    });
    cacheContainer.cache(0, 0, terrainWidth, terrainHeight);
    this.layers.terrain.addChild(cacheContainer);
    this.layers.terrain.addChild(this.layers.tiles); // make sure it's on top :)
    this.layers.terrain.addChild(this.layers.units); // make sure it's on top :)
    this.layers.terrain.x = settings.terrainX;
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
