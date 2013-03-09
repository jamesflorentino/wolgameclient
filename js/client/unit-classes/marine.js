var UnitSprite = require('../unit-sprite');
var frameData = require('../frames/marine');

var spriteSheet = new createjs.SpriteSheet(frameData);
spriteSheet.getAnimation('move_start').next = 'move';
spriteSheet.getAnimation('move_end').next = 'idle';

var Marine = function() {
    this.initialize.apply(this, arguments);
};

Marine.prototype = new UnitSprite();

Marine.prototype.__super = UnitSprite.prototype;

Marine.prototype.initialize = function(entity) {
    this.__super.initialize.apply(this, arguments);
    this.walkDuration = 600;
    this.animation = new createjs.BitmapAnimation(spriteSheet);
    this.container.addChild(this.animation);
    this.animation.gotoAndPlay('idle');
    /** Sequence Events **/
};

Marine.prototype.moveStart = function() {
    this.animation.gotoAndPlay('move_start');
};

Marine.prototype.moveEnd = function() {
    this.animation.gotoAndPlay('move_end');
};

module.exports = Marine;
