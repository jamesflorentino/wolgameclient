/**
 * @author James Florentino
 * This file will contain the graphics part
 */
/*jshint laxcomma: true*/

/** SpriteSheet frame data  **/
var hexutil = require('./client/hexutil')
, wol = require('./wol/wol')
, frames = require('./client/frames')
, settings = require('./client/settings')
, keycodes = require('./client/keycodes')
, keymanager = require('./client/keymanager')
, _ = require('underscore')
;

var terrainWidth = hexutil.WIDTH * settings.columns + (hexutil.WIDTH * 0.5);
var terrainHeight = hexutil.HEIGHT * settings.rows;
/** main layers **/
var containers = {
    terrain: null,
    units: null,
    tiles: null
};
var assetManifest = [
    frames.marine.images[0],
    frames.vanguard.images[0],
    frames.common.images[0],
    settings.terrainURI,
    settings.backgroundURI
];

var game;

/** To be defined later **/
var canvas, stage, queue, background, commonSpriteSheet;

/**
 * @return createjs.BitmapAnimation
 */
function createSprite(name) {
    var sheet, animation;
    var frameData = frames[name];
    if (frameData) {
        sheet = new createjs.SpriteSheet(frameData);
        animation = new createjs.BitmapAnimation(sheet);
        animation.gotoAndStop(1);
    }
    return animation;
}

function tick() {
    stage.update();
}

function pause() {
    createjs.Ticker.setPaused(true);
}

function resume() {
    createjs.Ticker.setPaused(false);
}

function getImage(url) {
    return queue.getResult(url);
}

/**
 * Generates the terrain in the map
 * @param {Function} fn
 */
function setTerrain(fn) {
    background = new createjs.Bitmap(getImage(settings.backgroundURI));
    containers.terrain = new createjs.Container();
    containers.units = new createjs.Container();
    containers.tiles = new createjs.Container();
    containers.terrain.addChild(containers.tiles, containers.units);
    stage.addChild(
        background, 
        containers.terrain
    );

    //terrain = new Bitmap(getImage(settings.terrainURI));
    //containers.terrain.addChild(terrain);
    containers.terrain.x = settings.terrainX;
    containers.terrain.y = settings.terrainY;
    console.debug('setTerrain');
    fn();
}

function setTerrainInteraction(fn) {
    var terrain = containers.terrain;
    var startX, panning, minX, maxX;
    maxX = 20;
    minX = canvas.width - terrainWidth - 20;
    //stage.addEventListener('stagemousemove', function(e) {
    //    var tx;
    //    if (panning) {
    //        tx = e.stageX - startX;
    //        tx = Math.min(tx, maxX);
    //        tx = Math.max(tx, minX);
    //        //tx = Math.min(tx, maxX);
    //        //tx = Math.max(tx, minX);
    //        terrain.x = tx;
    //    }
    //});
    //terrain.addEventListener('mousedown', function(e) {
    //    startX = e.stageX - terrain.x;
    //    panning = true;
    //});

    //stage.addEventListener('stagemouseup', function() {
    //    panning = false;
    //});
    fn();
}

function createImageSprite(name) {
    var tileMap;
    if (!commonSpriteSheet) {
        commonSpriteSheet = new createjs.SpriteSheet(frames.common);
    }
    tileMap = new createjs.BitmapAnimation(commonSpriteSheet);
    tileMap.gotoAndStop(name);
    return tileMap;
}

/**
 * Generates the sprited tiles
 * @param {Function} fn
 */
function setTilemaps(fn) {
    var tiles = game.tiles;
    var tileMapBackground = new createjs.Container();
    tiles.each(function(tile) {
        var tileMap = createImageSprite('hex_bg');
        hexutil.position(tileMap, tile);
        tileMapBackground.addChild(tileMap);
    });
    tileMapBackground.cache(0, 0, terrainWidth, terrainHeight);
    containers.tiles.addChild(tileMapBackground);

    console.debug('setTilemaps');
    fn();
}

function setGame(fn) {
    game = wol.createGame({ columns: settings.columns, rows: settings.rows });
    console.debug('setGame');
    fn();
}

function testUnit() {
    var tile = game.tiles.get(0,0);
    var tileCoord = hexutil.coord(tile, true);
    var marine = createSprite('marine');
    marine.x = tileCoord.x;
    marine.y =  tileCoord.y;
    marine.gotoAndPlay('idle');
    containers.units.addChild(marine);

    var unitTileMap = createTileMap(tile, 'hex_active');
    containers.tiles.addChild(unitTileMap);

    /** Test path finding algorithm  **/
    var moveableTiles = game.tiles.neighbors(tile, 3);
    var tileMaps = [];
    var linePath, tileMapsRange;

    var clearPath = function() {
        if (linePath && linePath.parent) {
            linePath.parent.removeChild(linePath);
        }
        while(tileMaps.length) {
            tileMaps[0].parent.removeChild(tileMaps[0]);
            tileMaps.shift();
        }
    };

    var clearRange = function() {
        while(tileMapsRange.length) {
            tileMapsRange[0].parent.removeChild(tileMapsRange[0]);
            tileMapsRange.shift();
        }
    };

    tileMapsRange = createTileMaps(moveableTiles, 'hex_move');

    _.each(tileMapsRange, function(tileMap, i) {
        var t = moveableTiles[i];
        tileMap.addEventListener('click', function() {
            clearPath();
            tileMaps = createPath(tile, t);
            var graphics = new createjs.Graphics();
            graphics
                .beginStroke('rgba(0,255,255,0.25)')
                .beginFill('cyan')
                .setStrokeStyle(6, 'round')
                .moveTo(unitTileMap.x, unitTileMap.y)
                .drawEllipse(unitTileMap.x - 10, unitTileMap.y - 5, 20, 10)
                .moveTo(unitTileMap.x, unitTileMap.y)
                ;
            _.each(tileMaps, function(tileMap, i) {
                graphics
                    .lineTo(tileMap.x, tileMap.y)
                    .drawEllipse(tileMap.x - 10, tileMap.y - 5, 20, 10)
                    .moveTo(tileMap.x, tileMap.y)
                    ;
                tileMap.scaleX = tileMap.scaleY = 0;
                createjs.Tween.get(tileMap)
                    .wait(40 * i)
                    .to({
                        scaleY: 1,
                        scaleX: 1
                    }, 350, createjs.Ease.quintOut);
                tileMap.addEventListener('click', function() {
                    clearPath();
                    clearRange();
                });
            });
            linePath = new createjs.Shape(graphics);
            containers.tiles.addChild(linePath);
        });
    });
}


/**
 * @param {Tile} start
 a @param {Tile} end
 * @return {Array}
 */
function createPath(start, end) {
    var path, tileMaps;
    path = game.tiles.findPath(start, end);
    tileMaps = createTileMaps(path, 'hex_move_select');
    return tileMaps;
}

function createTileMap(tile, name) {
    var tileMap;
    tileMap = createImageSprite(name);
    hexutil.position(tileMap, tile);
    return tileMap;
}

/**
 * @param {Array} tiles
 * @param {String} name
 * @param {Function} fn optional
 */
function createTileMaps(tiles, name, fn) {
    var tileMap, tile, tileMaps;
    tileMaps = [];
    for(var i=0; i<tiles.length; i++) {
        tileMap = createImageSprite(name);
        tile = tiles[i];
        hexutil.position(tileMap, tile);
        containers.tiles.addChild(tileMap);
        tileMaps.push(tileMap);
        if (typeof fn === 'function')  {
            fn(tileMap);
        }
    }
    return tileMaps;
}

function testGame() {
    /**
     * Add an entity
     * move the entity
     */

    var data = {
        id: 1,
        unit: 'marine',
        stats: {
            health: {
                value: 10,
                max: 100
            },
            attack: {
                value: 10,
                max: 10
            }
        }
    };

    //game.createEntity(data, function(entity) {
    //    createSpriteFromEntity(entity, function(sprite) {
    //    });
    //});
}

function start() {
    /** Welcome to the callback-ception. choo choo **/
    setGame(function(err) {
        setTerrain(function(err) {
            setTilemaps(function(err) {
                setTerrainInteraction(function(err) {
                    testGame();
                    //testUnit();
                    resume();
                });
            });
        });
    });
}

function preload() {
    queue = new createjs.LoadQueue();
    queue.addEventListener('complete', preloadComplete);
    queue.loadManifest(assetManifest);
}

function preloadComplete() {
    start();
}

/**
 * Called when he page is ready
 */
function ready() {
    canvas = document.querySelector('canvas#game');
    stage = new createjs.Stage(canvas);
    createjs.Ticker.addListener(tick);
    createjs.Ticker.setFPS(30);
    preload();
    //pause();
}

window.addEventListener('load', ready);
