/*global createjs */

var EventEmitter = require('events').EventEmitter;

var UnitSprite = function(entity) {
};

UnitSprite.prototype = new EventEmitter();

UnitSprite.prototype.entity = null;
UnitSprite.prototype.walkDuration = null;
UnitSprite.prototype.container = null;
UnitSprite.prototype.endAnimations = null;
UnitSprite.prototype.lastTile = null;
UnitSprite.prototype.infoButton = null;

UnitSprite.prototype.initialize = function(entity) {
    this.walkDuration = 1000;
    this.container = new createjs.Container();
    this.endAnimations = new EventEmitter();
};

UnitSprite.prototype.face = function(direction, prevent) {
    var scale;
    switch (direction) {
        case 'left':
            scale = -1;
        break;
        case 'right':
            scale = 1;
        break;
        default:
            throw 'unrecognized value `' + direction + '` for parameter direction. Possible values: left|right';
    }
    if (!prevent) {
        this.container.scaleX = scale;
    }
    if (this.infoButton) {
        this.infoButton.scaleX = scale;
    }
    this.direction = scale;
    this.emit('face', scale)
};

UnitSprite.prototype.moveStart = function() {
    this.emit('move:start');
};

UnitSprite.prototype.moveEnd = function() {
    this.emit('move:end');
};

UnitSprite.prototype.move = function(tile) {
    this.lastTile = tile;
    this.emit('move', tile);
};

UnitSprite.prototype.actEnd = function() {
    this.emit('act:end');
};

UnitSprite.prototype.actStart = function() {
    this.emit('act:start');
};

UnitSprite.prototype.act = function() {
    this.emit('act');
};

UnitSprite.prototype.damageStart = function() {
    this.emit('damage:start');
    this.defending = true;
};

/**
 * When the sprite resumes to its normal pose after receving damage
 */
UnitSprite.prototype.damageEnd = function() {
    this.emit('damage:end');
    this.emit('show:damage');
    this.defending = false;
};

/**
 * Event where the sprite receives a damage and performs a hit animation
 */
UnitSprite.prototype.damage = function() {
    this.emit('damage');
};

UnitSprite.prototype.die = function() {
    this.emit('die');
    this.emit('show:damage');
};



module.exports = UnitSprite;
