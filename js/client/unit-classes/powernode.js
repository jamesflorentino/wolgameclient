var UnitSprite = require('../unit-sprite');
var frameData = require('../frames/powernode');

var spriteSheet = new createjs.SpriteSheet(frameData);

spriteSheet.getAnimation('hit').next = 'idle';
spriteSheet.getAnimation('death').next = null;

var PowerNode = function() {
    this.initialize.apply(this, arguments);
};

PowerNode.prototype = new UnitSprite();
PowerNode.prototype.__super = UnitSprite.prototype;
PowerNode.prototype.initialize = function(entity) {
    this.__super.initialize.apply(this, arguments);
    this.animation = new createjs.BitmapAnimation(spriteSheet);
    this.container.addChild(this.animation);
    this.animation.gotoAndPlay('idle');
};

PowerNode.prototype.face = function(direction) {
    this.__super.face.call(this, direction, true);
};

PowerNode.prototype.damage = function() {
    this.animation.gotoAndPlay('hit');
    this.__super.damage.apply(this, arguments);
};

PowerNode.prototype.die = function() {
    this.animation.gotoAndPlay('death');
    this.__super.die.apply(this, arguments);
};

module.exports = PowerNode;


