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

/** Configurable params **/
var backgroundURI = '/media/backgrounds/teal.png';
var terrainURI = '/media/terrains/gravel.png';
var terrainX = 0;
var terrainY = 70;

/** SpriteSheet frame data  **/
var frames = {
    'marine': require('./sheets/marine'),
    'vanguard': require('./sheets/vanguard')
};

var wol = require('./wol/wol');



/** Assets to be preloaded **/
var assetManifest = [
    '/media/marine.png',
    '/media/vanguard.png',
    terrainURI,
    backgroundURI
];

/** main layers **/
var terrainContainer, unitContainer, background;

/** To be defined later **/
var stage, queue;

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

function start() {
    var game = wol.createGame();
    var entity = game.createEntity();
    console.log(entity.stats.toJSON());
    /**
    background = new Bitmap(getImage(backgroundURI));
    terrainContainer = new createjs.Container();
    unitContainer = new createjs.Container();
    stage.addChild(background, terrainContainer);

    terrain = new Bitmap(getImage(terrainURI));
    terrainContainer.x = terrainX;
    terrainContainer.y = terrainY;
    terrainContainer.addChild(terrain, unitContainer);

    var marine = createSprite('marine');
    marine.x = 100;
    marine.y=  100;
    marine.gotoAndPlay(1);
    unitContainer.addChild(marine);

    var vanguard = createSprite('vanguard');
    vanguard.x = 300;
    vanguard.y=  300;
    vanguard.gotoAndPlay(1);
    unitContainer.addChild(vanguard);
    /****/
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
    pause();
}

window.addEventListener('load', ready);
