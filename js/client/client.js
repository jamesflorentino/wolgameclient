/*jshint laxcomma: true */

/*global createjs */
var _ = require('underscore')
, Preloader = require('./Preloader')
, HexUtil = require('./hexutil')
, frames = require('./frames/frames') // spriteSheet frameData
, Game = require('../game/game')
, settings = require('./settings')
, EventEmitter = require('events').EventEmitter
, frameDataOffset = require('./frame-data-offset')
, wait = require('../game/wait')
, Ease = createjs.Ease
, Tween = createjs.Tween
, spriteClasses = {
    marine: require('./unit-classes/marine'),
    vanguard: require('./unit-classes/vanguard'),
    powernode: require('./unit-classes/powernode')
}
;

var Client = function(game) {
    this.initialize.apply(this, arguments);
};

Client.prototype = new EventEmitter();

Client.prototype.initialize = function(game) {
    var _this = this;
    var turnRoutes = new EventEmitter();

    this.game = game;
    this.units = {};
    this._unitList = [];
    this.preloader = new Preloader();

    turnRoutes.on('result:death', function(unit) {
        unit.die();
    });

    turnRoutes.on('result:damage', function(unit) {
        unit.damageEnd();
    });

    this.game.on('unit:add', function(entity) {
        _this.createUnit(entity);
    });

    this.game.on('unit:act', function(data) {
        _this.getUnit(data.id, function(unit) {
            var parent = unit;
            var targets = [];
            var tileSprites = [];
            /** Tell the active unit to which direction to face **/
            _this.getUnit(data.targets[0].id, function(unit) {
                parent.face(unit.container.x > parent.container.x ? 'right' : 'left');
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
                        scaleX: direction,
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
    this.width = canvas.width;
    this.height = canvas.height;
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

Client.prototype.applySpriteOffset = function(sprite, name) {
    var key;
    var offset = frameDataOffset[name];
    if (offset) {
        for(key in offset) {
            if (offset.hasOwnProperty(key)) {
                sprite[key] = offset[key];
            }
        }
    }
};

Client.prototype.createFGElement = function(name, tile, callback) {
    var animation, spriteSheet, coord, regX, regY, offsetDepth, _this = this;
    spriteSheet = this.spriteSheets.foreground;
    offsetDepth = typeof tile.offsetdepth === 'number' ? tile.offsetdepth : 0;
    if (spriteSheet.getAnimation(name)) {
        animation = new createjs.BitmapAnimation(spriteSheet);
        animation.gotoAndStop(name);
        coord = HexUtil.coord(tile);
        this.applySpriteOffset(animation, tile.type);
        animation.set({
            x: coord.x,
            y: coord.y
        });
        _this.setSpriteDepth(animation, tile.z + offsetDepth);
        if (typeof callback === 'function') {
            callback(animation);
        }
    }
    return animation;
};

Client.prototype.createSprite = function(name, callback) {
    var animation = new createjs.BitmapAnimation(this.spriteSheets.common);
    animation.gotoAndStop(name);
    this.applySpriteOffset(animation, name);
    if (typeof callback === 'function') {
        callback(null, animation);
    }
    return animation;
};

Client.prototype.createParticle = function(name, fn) {
    var animation = new createjs.BitmapAnimation(this.spriteSheets.particles);
    animation.gotoAndStop(name);
    fn(animation);
    return animation;
};

Client.prototype.setSpriteDepth = function(sprite, zIndex) {
    var i, _len, container, child;
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
        unit.infoButton = this.createSprite('show-unit-info');
        unit.infoButton.addEventListener('click', function() {
            _this.showUnitInfo(entity);
            Tween.get(unit.infoButton)
                .to({ scaleY: 1.5 }, 200, Ease.quartIn)
                .to({ scaleY: 1 }, 300, Ease.quartOut)
                ;
        });
        unit.infoButton.visible = false;
        unit.container.addChild(unit.infoButton);
        _this.addUnit(entity.id, unit, function() {
            _this.unitEvents(unit, entity);
            _this.spawnUnit(unit, entity.tile);
            if (typeof callback === 'function') {
                callback(unit);
            }
        });
    }
};

Client.prototype.createHealthBar = function() {
    var container = new createjs.Container();
    var bar = this.createSprite('hp-bar');
    var barBG = this.createSprite('hp-bar-bg');
    var bg = this.createSprite('hp-bg');
    bar.name = 'bar';
    barBG.name = 'bar-bg';
    bg.name = 'bg';
    container.addChild(bg, barBG, bar);
    return container;
};

Client.prototype.showTileBonus = function(tile, fn) {
    var _this = this;
    var name;
    if (_.has(tile, 'attack')) {
        name = 'atkup';
    } else if (_.has(tile, 'defense')) {
        name = 'defup';
    }
    if (name) {
        _this.createParticle(name, function(particle) {
            var coord = HexUtil.coord(tile, true);
            var origX = coord.x + 20;
            var origY = coord.y - 40;
            particle.set({
                x: origX,
                y: origY + 40
            });
            Tween.get(particle)
                .to({
                    y: origY
                }, 850, Ease.backOut);
            _this.layers.particles.addChild(particle);
            if (typeof fn === 'function') {
                fn(particle);
            }
        });
    }
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
            unit.emit('spawn');
            unit.face(tile.x > Game.columns * 0.5 ? 'left' : 'right');
            if (typeof callback === 'function') {
                callback(null, unit);
            }
        }
    }
};

Client.prototype.addUnit = function(id, unit, callback) {
    this._unitList.push(unit);
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

Client.prototype.getTileSpriteName = function(tile) {
    var tileName = 'hex_bg_inset';
    if (_.has(tile, 'attack')) {
        tileName = 'hex_atkup';
    } else if (_.has(tile, 'defense')) {
        tileName = 'hex_defup';
    }
    return tileName;
};

Client.prototype.setTiles = function(tiles, callback) {
    var _this = this, cacheContainer;
    var terrainWidth = HexUtil.WIDTH * settings.columns + (HexUtil.WIDTH * 0.5);
    var terrainHeight = HexUtil.HEIGHT * settings.rows;
    if ((cacheContainer = this.layers.terrain.getChildByName('tileBackgrounds'))) {
        cacheContainer.parent.removeChild(cacheContainer);
    }
    cacheContainer = new createjs.Container();
    tiles.each(function(tile) {
        var tileName = _this.getTileSpriteName(tile);
        var t;
        if (!tile.wall) {
            _this.createSprite(tileName, function(err, tileSprite) {
                HexUtil.position(tileSprite, tile);
                if (_this.debug) {
                    t = new createjs.Text(tile.pos(), "10px Arial", "rgba(255, 255, 255, 0.5)");
                    t.textBaseLine = "ideographic";
                    t.textAlign = 'center';
                    HexUtil.position(t, tile, true);
                    cacheContainer.addChild(t);
                }
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
    this.layers.terrain.addChild(
        this.layers.tiles,
        this.layers.units,
        this.layers.particles,
        this.layers.hpbars
    ); // make sure it's on top :)
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
    this.layers.particles = new createjs.Container();
    this.layers.hpbars = new createjs.Container();
    this.layers.terrain.addChild(
        this.layers.tiles,
        this.layers.units,
        this.layers.particles,
        this.layers.hpbars
    );
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

Client.prototype.showUnitInfo = function(entity) {
    this.emit('input:unit:info', entity);
};

Client.prototype.showUnitOptions = function() {
    var _this = this;
    if (!this.layers.unitsDimmer) {
        this.layers.unitsDimmer = new createjs.Shape();
        this.layers.unitsDimmer.graphics
            .beginFill('rgba(0,0,0,0.45)')
            .drawRect(0, 0, this.width, this.height)
            ;
    }

    Tween.get(this.layers.unitsDimmer)
        .to({ alpha: 0 })
        .to({ alpha: 1 }, 200)
    ;

    _.each(this._unitList, function(unit, i) {
        unit.infoButton.visible = true;
        _this.layers.terrain.addChild(unit.infoButton);
        unit.infoButton.x = unit.container.x;
        unit.infoButton.y = unit.container.y;
        Tween.get(unit.infoButton)
            .to({ scaleX: 0, scaleY: 0 })
            .wait(i * 20)
            .to({ scaleX: 1, scaleY: 1 }, 500, Ease.backInOut)
        ;
    });

    this.layers.tiles.visible = false;
    this.layers.units.mouseEnabled = false;

    this.stage.addChildAt(this.layers.unitsDimmer, 1);

};

Client.prototype.hideUnitOptions = function() {
    if (this.layers.unitsDimmer) {
        this.layers.unitsDimmer.parent.removeChild(this.layers.unitsDimmer);
        _.each(this._unitList, function(unit) {
            unit.infoButton.visible = false;
        });
    }
    this.layers.units.mouseEnabled = true;
    this.layers.tiles.visible = true;
};

Client.prototype.unitEvents = function(unit, entity) {
    var game = this.game,
    _this = this;

    unit.hpbar = this.createHealthBar();
    this.layers.hpbars.addChild(unit.hpbar);

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
            sprite.addEventListener('mousedown', function() {
                unit.emit('tile:select');
            });
            unit.container.addChildAt(sprite, 0);
        });
    });

    entity.on('disable', function() {
        var sprite = unit.container.getChildByName('indicator');
        Tween.removeTweens(sprite);
        if (sprite) {
            sprite.parent.removeChild(sprite);
        }
    });

    entity.on('move:start', function moveStart(tile) {
        var tween, tweenHPBar;
        var path;
        var prevTile = unit.lastTile;
        path = game.tiles.findPath(prevTile, tile);
        unit.prevX = HexUtil.coord(prevTile).x;
        unit.moveStart();
        Tween.removeTweens(unit.container);
        Tween.get(unit.container.getChildByName('indicator')).to({ alpha: 0, scaleX: 0, scaleY: 0 }, 100);

        if (unit.tilePathObject) {
            _this.layers.tiles.removeChild.apply(_this.layers.tiles, unit.tilePathObject.tileSprites);
            _this.layers.tiles.removeChild(unit.tilePathObject.linePath);
        }

        if (unit.particles) {
            _.each(unit.particles, function(particle) {
                Tween.get(particle)
                .to({
                    y: particle.y + 40,
                    alpha: 0
                }, 800, Ease.backIn)
                .call(function() {
                    particle.parent.removeChild(particle);
                });
            });
            unit.particles = [];
        }

        tween = Tween.get(unit.container);
        tweenHPBar = Tween.get(unit.hpbar);
        unit.tilePathObject = _this.generateTilePath(
            [prevTile].concat(path),
            function(tileSprite, i, prevTileSprite, tile) {
                var walkDuration =
                        tileSprite.y !== (prevTileSprite ? prevTileSprite.y : tileSprite.y) ?
                        unit.walkDuration * 0.75 :
                        unit.walkDuration;
                var props = {
                    x: tileSprite.x,
                    y: tileSprite.y
                };
                if (i) { // Skip the 1st tile since it's the current
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
                        .to(props, walkDuration);
                    tweenHPBar = tweenHPBar.to(props, walkDuration);
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
        unit.hpbar.set({
            x: unit.container.x,
            y: unit.container.y
        })
        unit.move(tile);
    });

    unit.on('spawn', function() {
        unit.hpbar.set({
            x: unit.container.x,
            y: unit.container.y
        });
    });

    unit.on('show:damage', function() {
        var scaleX = entity.stats.get('health').ratio();
        var ease = Ease.quintOut;
        var time = 500;
        Tween.get(unit.hpbar.getChildByName('bar')).to({
            scaleX: scaleX
        }, time, ease);
        Tween.get(unit.hpbar.getChildByName('bar-bg')).wait(300).to({
            scaleX: scaleX
        }, time, ease);
    });

    unit.on('move', function sortUnits(tile) {
        _this.setSpriteDepth(unit.container, unit.currentTileZ || tile.z);
    });

    unit.on('move:end', function() {
        var indicator = unit.container.getChildByName('indicator');
        if (indicator) {
            Tween.get(indicator).to({ alpha: 1, scaleX: 1, scaleY: 1 }, 600, Ease.quintInOut);
        }
        _this.showTileBonus(entity.tile, function(particle) {
            unit.particles = [particle];
        });
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
                tileSprite.addEventListener('mousedown', function() {
                    var tiles, pathSpriteObject, lastTile;
                    var path = game.tiles.findPath(entity.tile, tile);
                    tiles = [entity.tile].concat(path);
                    unit.emit('tiles:hide:target');
                    unit.emit('tiles:hide:path');
                    pathSpriteObject = _this.generateTilePath(tiles);
                    lastTile = pathSpriteObject.tileSprites[pathSpriteObject.tileSprites.length - 1];
                    lastTile.addEventListener('mousedown', function() {
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
        var entityTile = entity.tile;
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
                            truthy = false;
                        }
                        return truthy;
                    });
                    return truthy;
                });

                (function sortLineOfSight() {
                    var tile
                       , start
                       , end
                       , slope
                       , distance
                       , i
                    ;
                    var slopes = {}
                    ,   pair
                    ;
                    for(i=0, total=targets.length; i < total; i++) {
                        tile = targets[i];
                        start = HexUtil.coord(entity.tile);
                        end = HexUtil.coord(tile);
                        // Pythagorean theorem for distance calculation
                        // used for determining line of sight.
                        distance = Math.sqrt(
                            Math.pow(end.x - start.x, 2) +
                            Math.pow(end.y - start.y, 2)
                        );
                        // use to determine the slope of the unit.
                        slope = (end.y - start.y) / (end.x - start.x);
                        pair = [distance, tile];
                        if (!slopes[slope]) {
                            slopes[slope] = [];
                        }
                        if (slopes[slope][0]) {
                            // we only need the shortest distance avaiable. If they are a tie, they can
                            // share the same array
                            // [distance, tile]
                            if (distance < slopes[slope][0][0]) { // if the distance is lower
                                slopes[slope] = [pair];
                            } else if (distance === slopes[slope][0][0]) {
                                slopes[slope].push(pair);
                            }
                        } else {
                            slopes[slope].push(pair);
                        }
                    }
                    var results = [];
                    for(var k in slopes) {
                        if(slopes.hasOwnProperty(k)) {
                            for(var j=0; j<slopes[k].length;j++) {
                                results.push(slopes[k][j][1]);
                            }
                        }
                    }
                    targets = results;
                }).call();

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
                    tileSprite.addEventListener('mousedown', function() {
                        var tiles, tileSprites;
                        tiles = [tile];
                        tileSprites = [];

                        unit.emit('tiles:hide:path');
                        unit.emit('tiles:hide:target');
                        unit.tileSpritesTargetMark = [];

                        _this.createTiles('hex_target_mark', tiles, function(err, tileSprite, tile, i) {
                            targetUnit.container.addChildAt(tileSprite, 1);
                            tileSprites.push(tileSprite);
                            tileSprite.addEventListener('mousedown', function() { 
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
                            _this.createTiles('hex_target', splashTiles, function(err, tileSprite, tile) {
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

Client.create = function(game, callback) {
    var client = new Client(game);
    callback(null, client);
};

module.exports = Client;
