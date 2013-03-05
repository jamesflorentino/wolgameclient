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
var canvas, stage, queue, background;

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
    containers.terrain.addChild(containers.tiles);
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
    stage.addEventListener('stagemousemove', function(e) {
        var tx;
        if (panning) {
            tx = e.stageX - startX;
            tx = Math.min(tx, maxX);
            tx = Math.max(tx, minX);
            //tx = Math.min(tx, maxX);
            //tx = Math.max(tx, minX);
            terrain.x = tx;
        }
    });
    terrain.addEventListener('mousedown', function(e) {
        startX = e.stageX - terrain.x;
        panning = true;
    });

    stage.addEventListener('stagemouseup', function() {
        panning = false;
    });
}

/**
 * Generates the sprited tiles
 * @param {Function} fn
 */
function setTilemaps(fn) {
    var tiles = game.tiles;
    var tileMapBackground = new createjs.Container();
    tiles.each(function(tile) {
        var tileMap = new createjs.BitmapAnimation(new createjs.SpriteSheet(frames.common));
        tileMap.gotoAndPlay('hex_bg');
        hexutil.position(tileMap, tile);
        tileMapBackground.addChild(tileMap);
    });
    tileMapBackground.cache(0, 0, terrainWidth, terrainHeight);
    containers.tiles.addChild(tileMapBackground);

    var tileCoord = hexutil.coord(tiles.get(0,0), true);
    var marine = createSprite('marine');
    marine.x = tileCoord.x;
    marine.y =  tileCoord.y;
    marine.gotoAndPlay('idle');
    containers.units.addChild(marine);
    console.debug('setTilemaps');
    fn();
}

function setGame(fn) {
    game = wol.createGame({ columns: settings.columns, rows: settings.rows });
    console.debug('setGame');
    fn();
}

function start() {
    setGame(function(err) {
        setTerrain(function(err) {
            setTilemaps(function(err) {
                setTerrainInteraction(function(err) {
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
