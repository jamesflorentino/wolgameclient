/*global createjs */
var Preloader = require('./Preloader');
var HexUtil = require('./hexutil');
var frames = require('./frames/frames'); // spriteSheet frameData
var Game = require('../game/game');
var settings = require('./settings');
var EventEmitter = require('events').EventEmitter;
var spriteClasses = {
    marine: require('./unit-classes/marine'),
    vanguard: require('./unit-classes/vanguard')
};
var frameDataOffset = require('./frame-data-offset');
var _ = require('underscore');
var Ease = createjs.Ease;
var Tween = createjs.Tween;
var wait = require('../game/wait');

var Client = function(game) {
    this.initialize.apply(this, arguments);
};

Client.prototype = new EventEmitter();

Client.prototype.initialize = function(game) {
    var _this = this;
    var turnRoutes = new EventEmitter();

    this.game = game;
    this.units = {};
    this.preloader = new Preloader();

    turnRoutes.on('result:death', function(unit) {
        unit.die();
    });

    turnRoutes.on('result:damage', function(unit) {
        unit.damageEnd();
    });

    this.game.on('unit:add', function(entity) {
        _this.createUnit(entity, function(unit) {
            //unit.container.addEventListener('click', function() {
            //    _this.emit('unit:info', entity);
            //});
        });
    });

    this.game.on('unit:act', function(data) {
        _this.getUnit(data.id, function(unit) {
            var parent = unit;
            var targets = [];
            var tileSprites = [];
            /** Tell the active unit to which direction to face **/
            _this.getUnit(data.targets[0].id, function(unit) {
                parent.face(unit.container.x > parent.container.x ? 'right' : 'left')
            });
            _.each(data.targets, function(target) {
                _this.getUnit(target.id, function(unit) {
                    unit.face(unit.container.x < parent.container.x ? 'right' : 'left');
                });
            });
            // Make sure they're all clean
            unit.removeAllListeners('act:end');
            unit.removeAllListeners('act');

            unit.on('act:end', function() {
                unit.removeAllListeners('act:end');
                unit.removeAllListeners('act');
                _.each(targets, function(target) {
                    var entity = target.entity;
                    var unit = target.unit;
                    var damage = target.damage;
                    _this.showDamage(unit, damage);
                });

                _.each(data.results, function(result) {
                    _this.getUnit(result.id, function(unit) {
                        turnRoutes.emit('result:' + result.status, unit);
                    });
                });
                _.each(tileSprites, function(tileSprite) {
                    tileSprite.parent.removeChild(tileSprite);
                });
            });

            unit.on('act', function() {
                _.each(targets, function(target, i) {
                    var unit = target.unit;
                    var coord = HexUtil.coord(target.entity.tile, true);
                    var posX = coord.x + (unit.container.x > parent.container.x ? 10 : -10);
                    var direction = unit.direction;
                    Tween.get(unit.container)
                    .wait(i * 50)
                    .call(function() {
                        unit.damage();
                    })
                    .to({
                        scaleX: 1.15 * direction,
                        scaleY: 1.15,
                        x: posX
                    }).to({
                        scaleX: 1 * direction,
                        scaleY: 1,
                        x: coord.x
                    }, 300, Ease.backOut)
                    ;
                });
            });

            _.each(data.targets, function(obj) {
                var id = obj.id;
                var damage = obj.damage;
                _this.game.getEntity(id, function(entity) {
                    _this.getUnit(id, function(unit) {
                        _this.createTile('hex_target', entity.tile, function(tileSprite) {
                            targets.push({
                                unit: unit,
                                entity: entity,
                                damage: damage
                            });
                            tileSprites.push(tileSprite);
                            unit.damageStart();
                        });
                    });
                });
            });


            unit.actStart();
        });
    });
};

Client.prototype.setScene = function(canvas, callback) {
    var _this = this;
    this.layers = {};
    this.stage = new createjs.Stage(canvas);
    createjs.Touch.enable(this.stage);
    _this.resource('background', function(err, backgroundImage){ 
        _this.setSpriteSheets(function() {
            _this.setBackground(backgroundImage, function() {
                _this.initializeLayers(function() {
                    _this.setTiles(_this.game.tiles, function() {
                        _this.game.on('tiles:config', function() {
                            _this.setTiles(_this.game.tiles);
                        });
                        _this.setTimers(function() {
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

Client.prototype.createFGElement = function(name, tile, callback) {
    var animation, spriteSheet, coord, regX, regY, offset, _this = this;
    spriteSheet = this.spriteSheets.foreground;
    if (spriteSheet.getAnimation(name)) {
        animation = new createjs.BitmapAnimation(spriteSheet);
        animation.gotoAndStop(name);
        coord = HexUtil.coord(tile);
        offset = frameDataOffset[tile.type];
        regX = offset && offset.regX ? offset.regX : 0;
        regY = offset && offset.regY ? offset.regY : 0;
        animation.set({
            x: coord.x,
            y: coord.y,
            regX: regX,
            regY: regY
        });
        _this.setSpriteDepth(animation, tile.z);
        if (typeof callback === 'function') {
            callback(animation);
        }
    }
    return animation;
};

Client.prototype.createSprite = function(name, callback) {
    var animation = new createjs.BitmapAnimation(this.spriteSheets.common);
    animation.gotoAndStop(name);
    callback(null, animation);
};

Client.prototype.setSpriteDepth = function(sprite, zIndex) {
    var i, index, _len, container, child;
    container = this.layers.units;
    sprite.z = zIndex;
    container.removeChild(sprite);
    for(i = 0, _len = container.children.length; i < _len; i++) {
        child = container.children[i];
        if (child.z >= sprite.z) {
            break;
        }
    }
    container.addChildAt(sprite, i);
};

Client.prototype.createUnit = function(entity, callback) {
    var unit, UnitSpriteClass, _this = this;
    UnitSpriteClass = spriteClasses[entity.type];
    if (UnitSpriteClass) {
        unit = new UnitSpriteClass(entity);
        unit.id = entity.id;
        _this.addUnit(entity.id, unit, function() {
            _this.unitEvents(unit, entity);
            _this.spawnUnit(unit, entity.tile);
            if (typeof callback === 'function') {
                callback(unit);
            }
        });
    }
};

Client.prototype.unitEvents = function(unit, entity) {
    var game = this.game,
    _this = this;


    entity.on('die', function() {
        _this.removeUnit(unit);
    });

    entity.on('enable', function() {
        _this.createSprite('hex_active', function(err, sprite) {
            sprite.name = 'indicator';
            sprite.set({
                regX: HexUtil.WIDTH * 0.5 + 6,
                regY: HexUtil.HEIGHT * 0.5,
                scaleX: 0,
                scaleY: 0,
                alpha: 0
            });
            Tween.get(sprite)
                .to({
                    scaleX: 1,
                    scaleY: 1,
                    alpha: 1
                }, 450, Ease.backInOut);
            sprite.addEventListener('click', function() {
                unit.emit('tile:select');
            });
            unit.container.addChildAt(sprite, 0);
        });
    });

    entity.on('disable', function() {
        var sprite = unit.container.getChildByName('indicator');
        if (sprite) {
            sprite.parent.removeChild(sprite);
        }
    });

    entity.on('move:start', function moveStart(tile) {
        var tween;
        var path;
        var prevTile = unit.lastTile;
        path = game.tiles.findPath(prevTile, tile);
        unit.prevX = HexUtil.coord(prevTile).x;
        unit.moveStart();
        Tween.removeTweens(unit.container);
        if (unit.tilePathObject) {
            _this.layers.tiles.removeChild.apply(_this.layers.tiles, unit.tilePathObject.tileSprites);
            _this.layers.tiles.removeChild(unit.tilePathObject.linePath);
        }
        tween = Tween.get(unit.container);
        unit.tilePathObject = _this.generateTilePath(
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
                            unit.currentTileZ = tile.z;
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
            var linePath = unit.tilePathObject.linePath;
            var tileSprites = unit.tilePathObject.tileSprites;
            _.each(tileSprites, function(tileSprite, i) {
                Tween.get(tileSprite).wait(i * 100)
                .to({
                    scaleX: 0,
                    scaleY: 0
                }, 250, Ease.backIn)
                .call(function() {
                    if (tileSprite.parent) {
                        tileSprite.parent.removeChild(tileSprite);
                    }
                });
            });
            Tween
                .get(linePath)
                .wait(105 * tileSprites.length)
                .to({
                    alpha: 0
                }, 150)
                .call(function() {
                    if (linePath.parent) {
                        linePath.parent.removeChild(linePath);
                    }
                });
            unit.moveEnd();
        });
    });

    entity.on('move:update', function(tile) {
        var coord = HexUtil.coord(tile, true);
        Tween.removeTweens(unit.container);
        if (unit.tilePathObject) {
            _this.layers.tiles.removeChild.apply(_this.layers.tiles, unit.tilePathObject.tileSprites);
            _this.layers.tiles.removeChild(unit.tilePathObject.linePath);
        }
        unit.prevX = HexUtil.coord(unit.lastTile).x;
        unit.container.x = coord.x;
        unit.container.y = coord.y;
        unit.move(tile);
    });

    unit.on('move', function sortUnits(tile) {
        var z = unit.currentTileZ !== null ? unit.currentTileZ : tile.z;
        _this.setSpriteDepth(unit.container, unit.currentTileZ || tile.z);
    });

    unit.on('tile:select', function inputSelect() {
        if (_this.game.currentTurn === entity) {
            unit.emit('tile:select:move');
            unit.emit('tile:select:act');
        }
    });

    unit.on('tile:select:move', function() {
        var moveTiles;
        if (unit.tileSprites) {
            unit.emit('tiles:hide:path');
            unit.emit('tiles:hide:move');
        } else {
            unit.tileSprites = [];
            movable = game.tiles.findRange(entity.tile, entity.stats.get('range').value);
            moveTiles = _.filter(movable, function(tile) {
                return tile.entities.length === 0 && !tile.wall && tile !== entity.tile;
            });

            // show moveable tiles
            _this.createTiles('hex_move', moveTiles, function(err, tileSprite, tile, i) {
                tileSprite.addEventListener('click', function() {
                    var tiles, pathSpriteObject, lastTile;
                    var path = game.tiles.findPath(entity.tile, tile);
                    tiles = [entity.tile].concat(path);
                    unit.emit('tiles:hide:target');
                    unit.emit('tiles:hide:path');
                    pathSpriteObject = _this.generateTilePath(tiles);
                    lastTile = pathSpriteObject.tileSprites[pathSpriteObject.tileSprites.length - 1];
                    lastTile.addEventListener('click', function() {
                        wait(100, function() {
                            _this.emit('input:move', {
                                tile: tile,
                                entity: entity
                            });
                        });
                        unit.emit('tiles:hide:all');
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
                    .wait(i * 10)
                    .to({
                        scaleX: 1,
                        scaleY: 1,
                        alpha: 1
                    }, 200, Ease.backOut);
            });
        }
    });

    unit.on('tile:select:act', function(command) {
        var targets;
        if (command || (command = entity.commands.first())) {
            if (unit.tileSpritesTarget) {
                unit.emit('tiles:hide:act');
                unit.emit('tiles:hide:target');
            } else {
                unit.tileSpritesTarget = [];
                targets = game.tiles.neighbors(entity.tile, command.range);
                targets = _.filter(targets, function(tile) {
                    var truthy = tile.entities.length > 0;
                    _.each(tile.entities, function(entity) {
                        if (entity.stats.get('health').val() === 0) {
                            return (truthy = false);
                        }
                    });
                    return truthy;
                });

                _this.createTiles('hex_target', targets, function(err, tileSprite, tile, i) {
                    var targetUnit;
                    var targetEntity;
                    targetEntity = tile.entities[0];
                    if (targetEntity) {
                        targetUnit = _this.getUnit(targetEntity.id);
                        if (targetUnit) {
                            targetUnit.container.addChildAt(tileSprite, 0);
                        }
                    }
                    unit.tileSpritesTarget.push(tileSprite);
                    tileSprite.addEventListener('click', function() {
                        var tiles, tileSprites;
                        tiles = [tile];
                        tileSprites = [];

                        unit.emit('tiles:hide:path');
                        unit.emit('tiles:hide:target');
                        unit.tileSpritesTargetMark = [];

                        _this.createTiles('hex_target_mark', tiles, function(err, tileSprite, tile, i) {
                            targetUnit.container.addChildAt(tileSprite, 1);
                            tileSprites.push(tileSprite);
                            tileSprite.addEventListener('click', function() { 
                                /** delay to give some breathing space to the UI **/
                                wait(100, function() {
                                    _this.emit('input:act', {
                                        tile: tile,
                                        entity: entity,
                                        target: targetEntity,
                                        command: command
                                    });
                                });
                                unit.emit('tiles:hide:all');
                            });
                            tileSprite.set({
                                x: 0,
                                y: 0,
                                scaleX: 0,
                                scaleY: 0,
                                alpha: 0
                            });
                            Tween.get(tileSprite)
                            .wait(i * 10)
                            .to({
                                scaleX: 1,
                                scaleY: 1,
                                alpha: 1
                            }, 200, Ease.backOut);

                            var splashTiles = game.tiles.neighbors(tile, command.splash);
                            splashTiles = _.filter(splashTiles, function(tile) {
                                var entities = tile.entities;
                                return entities.length && entities[0] !== entity && !entities[0].isDead();
                            });
                            var targetTile = tile;
                            _this.createTiles('hex_target', splashTiles, function(err, tileSprite, tile, i) {
                                unit.tileSpritesTargetMark.push(tileSprite);
                                var linePath = _this.createAttackLinePath(targetTile, tile);
                                unit.tileSpritesTargetMark.push(linePath);
                            });
                        });

                        var linePath = _this.createAttackLinePath(entity.tile, tile);
                        unit.tileSpritesTargetMark.push(linePath);
                        unit.tileSpritesTargetMark = unit.tileSpritesTargetMark.concat(tileSprites);
                    });
                    tileSprite.set({
                        x: 0,
                        y: 0,
                        scaleX: 0,
                        scaleY: 0,
                        alpha: 0
                    });
                    Tween.get(tileSprite)
                    .wait(i * 10)
                    .to({
                        scaleX: 1,
                        scaleY: 1,
                        alpha: 1
                    }, 200, Ease.backOut);
                });
            }
        }
    });

    unit.on('tiles:hide:all', function() {
        unit.emit('tiles:hide:path');
        unit.emit('tiles:hide:move');
        unit.emit('tiles:hide:act');
        unit.emit('tiles:hide:target');
    });

    unit.on('tiles:hide:act', function() {
        var tiles = unit.tileSpritesTarget;
        if (tiles) {
            _.each(tiles, function(sprite) {
                sprite.parent.removeChild(sprite);
            });
            delete unit.tileSpritesTarget;
        }
    });

    unit.on('tiles:hide:target', function() {
        var tiles = unit.tileSpritesTargetMark;
        if (tiles) {
            _.each(tiles, function(sprite) {
                sprite.parent.removeChild(sprite);
            });
            delete unit.tileSpritesTargetMark;
        }
    });

    unit.on('tiles:hide:path', function() {
        var tiles = unit.tileSpritePaths;
        if (tiles) {
            _this.layers.tiles.removeChild.apply(_this.layers.tiles, tiles);
            delete unit.tileSpritePaths;
        }
    });

    unit.on('tiles:hide:move', function() {
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
            var posY = unit.container.y - 80;
            spacing += settings.numberSpacing[numeral];
            sprite.set({
                x: posX,
                y: posY + Math.random() * 50,
                alpha: 0
            });
            _this.layers.terrain.addChild(sprite);
            Tween.get(sprite)
                .wait(i * 80)
                .to({
                    x: posX,
                    y: posY - 20,
                    alpha: 1
                }, 400, Ease.backOut)
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
        callback(tileSprite);
    });
};

Client.prototype.createAttackLinePath = function(tileA, tileB) {
    var graphics = new createjs.Graphics();
    var linePath = new createjs.Shape(graphics);
    var coordA = HexUtil.coord(tileA, true);
    var coordB = HexUtil.coord(tileB, true);
    graphics
        //.beginStroke('white')
        //.beginFill('white')
        .setStrokeStyle(1, 'round')
        .beginStroke('rgba(255,10,0,0.75)')
        .beginFill('rgba(255,10,0,0.25)')
        .drawEllipse(coordA.x - 13, coordA.y - 7, 30, 15)
        .closePath()
        .drawEllipse(coordA.x - 10, coordA.y - 5, 20, 10)
        ;

    if (coordA.y === coordB.y) {
        graphics
        .mt(coordA.x, coordA.y - 5)
        .lt(coordA.x, coordA.y + 5)
        .lt(coordB.x, coordB.y)
        .closePath()
        ;
    } else {

        graphics
        .mt(coordA.x - 20, coordA.y)
        .lt(coordA.x + 20, coordA.y)
        .lt(coordB.x, coordB.y)
        .closePath()
        ;
    }
    this.layers.tiles.addChild(linePath);
    return linePath;
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
                .wait(i * 40)
                .to({
                    scaleX: 1,
                    scaleY: 1
                }, 200, Ease.backOut);
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

Client.prototype.spawnUnit = function(unit, tile, callback) {
    var coord;
    if (unit) {
        if (tile) {
            coord = HexUtil.coord(tile, true);
            unit.container.x = coord.x;
            unit.container.y = coord.y;
            unit.move(tile);
            unit.face(tile.x > Game.columns * 0.5 ? 'left' : 'right');
            if (typeof callback === 'function') {
                callback(null, unit);
            }
        }
    }
};

Client.prototype.addUnit = function(id, unit, callback) {
    this.units[id] = unit;
    callback(null, unit);
};

Client.prototype.removeUnit = function(unit) {
    delete this.units[unit.id];
    this.layers.units.removeChild(unit.container);
};

Client.prototype.getUnit = function(id, callback) {
    var unit = this.units[id];
    if (typeof callback === 'function') {
        if (unit) {
            callback(unit);
        }
    }
    return unit;
};

Client.prototype.getSpriteSheet = function(name, callback) {
    var spriteSheet = this.spriteSheets[name];
    callback(null, spriteSheet);
};

Client.prototype.setTiles = function(tiles, callback) {
    var _this = this, cacheContainer;
    var terrainWidth = HexUtil.WIDTH * settings.columns + (HexUtil.WIDTH * 0.5);
    var terrainHeight = HexUtil.HEIGHT * settings.rows;
    if ((cacheContainer = this.layers.terrain.getChildByName('tileBackgrounds'))) {
        cacheContainer.parent.removeChild(cacheContainer);
    }
    cacheContainer = new createjs.Container();
    tiles.each(function(tile, i) {
        if (!tile.wall) {
            _this.createSprite('hex_bg_inset', function(err, tileSprite) {
                HexUtil.position(tileSprite, tile);
                cacheContainer.addChild(tileSprite);
            });
        }
        if (tile.type) {
            _this.createFGElement(tile.type, tile);
        }
    });
    cacheContainer.cache(0, 0, terrainWidth, terrainHeight);
    cacheContainer.name = 'tileBackgrounds';
    this.layers.terrain.addChild(cacheContainer);
    this.layers.terrain.addChild(this.layers.tiles); // make sure it's on top :)
    this.layers.terrain.addChild(this.layers.units); // make sure it's on top :)
    this.layers.terrain.x = settings.terrainX;
    this.layers.terrain.y = settings.terrainY;
    if (typeof callback === 'function') {
        setTimeout(function() {
            cacheContainer.cache(0, 0, terrainWidth, terrainHeight);
        },250);
        callback(tiles);
    }
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
