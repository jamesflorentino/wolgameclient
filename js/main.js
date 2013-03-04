/**
 * @author James Florentino
 * This file will contain the graphics part
 */
var BitmapAnimation = createjs.BitmapAnimation,
SpriteSheet = createjs.SpriteSheet,
Ticker = createjs.Ticker,
Container = createjs.Container,
Bitmap = createjs.Bitmap
;

/** SpriteSheet frame data  **/
var frames = {
    'marine': require('./sheets/marine'),
    'vanguard': require('./sheets/vanguard'),
    'common': require('./sheets/common')
},
hexutil = require('./client/hexutil'),
wol = require('./wol/wol'),
settings = {
    backgroundURI: '/media/backgrounds/teal.png',
    terrainURI: '/media/terrains/gravel.png',
    terrainX: 0,
    terrainY: 70,
    rows: 8,
    columns: 8
};
/** main layers **/
var containers = {
    terrain: null,
    units: null
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
var stage, queue, background;

/**
 * @return createjs.BitmapAnimation
 */
function createSprite(name) {
    var sheet, animation;
    var frameData = frames[name];
    if (frameData) {
        sheet = new SpriteSheet(frameData);
        animation = new BitmapAnimation(sheet);
        animation.gotoAndStop(1);
    }
    return animation;
}

function tick() {
    stage.update();
}

function pause() {
    Ticker.setPaused(true);
}

function resume() {
    Ticker.setPaused(false);
}

function getImage(url) {
    return queue.getResult(url);
}


function setTerrain(fn) {
    background = new Bitmap(getImage(settings.backgroundURI));
    containers.terrain = new createjs.Container();
    containers.units = new createjs.Container();
    stage.addChild(background, containers.terrain);

    terrain = new Bitmap(getImage(settings.terrainURI));
    containers.terrain.x = settings.terrainX;
    containers.terrain.y = settings.terrainY;
    containers.terrain.addChild(terrain, containers.units);
    console.log('asd');
    fn();
}

function setTilemaps(fn) {
    var tiles = game.tiles;
    var tileMapBackground = new Container();
    tiles.each(function(tile) {
        var tileMap = new BitmapAnimation(new SpriteSheet(frames.common));
        tileMap.gotoAndPlay('hex_bg');
        hexutil.position(tileMap, tile);
        tileMapBackground.addChild(tileMap);
    });
    tileMapBackground.cache(
        0, 
        0, 
        hexutil.WIDTH * settings.columns + (hexutil.WIDTH * 0.5), 
        hexutil.HEIGHT * settings.rows
    );
    containers.terrain.addChild(tileMapBackground);


    var tileCoord = hexutil.coord(tiles.get(0,0), true);
    var marine = createSprite('marine');
    marine.x = tileCoord.x;
    marine.y =  tileCoord.y;
    marine.gotoAndPlay('idle');
    containers.units.addChild(marine);
    fn();
}

function setGame(fn) {
    game = wol.createGame({ columns: settings.columns, rows: settings.rows });
    fn();
}

function start() {

    setGame(function(err) {
        setTerrain(function(err) {
            setTilemaps(function(err) {});
        });
    });


    //var vanguard = createSprite('vanguard');
    //vanguard.x = 300;
    //vanguard.y=  300;
    //vanguard.gotoAndPlay(1);
    //containers.units.addChild(vanguard);

    resume();
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
    var canvas = document.querySelector('canvas#game');
    stage = new createjs.Stage(canvas);
    Ticker.addListener(tick);
    Ticker.setFPS(30);
    preload();
    //pause();
}

window.addEventListener('load', ready);
