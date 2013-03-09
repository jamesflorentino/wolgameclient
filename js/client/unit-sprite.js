/*global createjs */
var EventEmitter = require('events').EventEmitter;

var UnitSprite = function(entity) {
};

UnitSprite.prototype = new EventEmitter();

UnitSprite.prototype.initialize = function(entity) {
    this.entity = entity;
    this.walkDuration = 1000;
    this.container = new createjs.Container();
};

UnitSprite.prototype.face = function(direction) {
    switch (direction) {
        case 'left':
            this.container.scaleX = -1;
            break;
        case 'right':
            this.container.scaleX = 1;
            break;
        default:
            throw 'unrecognized value `' + direction + '` for parameter direction. Possible values: left|right';
            break;
    }
};

UnitSprite.prototype.moveStart = function() {
    this.emit('move:start');
};

UnitSprite.prototype.moveEnd = function() {
    this.emit('move:end');
};

module.exports = UnitSprite;
