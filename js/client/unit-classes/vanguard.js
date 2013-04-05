var UnitSprite = require('../unit-sprite');
var frameData = require('../frames/vanguard');

var spriteSheet = new createjs.SpriteSheet(frameData);
// loop back to idle
spriteSheet.getAnimation('defend_end').next =
spriteSheet.getAnimation('attack').next =
spriteSheet.getAnimation('move_end').next = 'idle';
// do not loop
spriteSheet.getAnimation('die_end').next =
spriteSheet.getAnimation('defend_start').next = false;
// others
spriteSheet.getAnimation('move_start').next = 'move';
spriteSheet.getAnimation('die_start').next = 'die_end';
spriteSheet.getAnimation('hit').next = 'defend_hold';

var Vanguard = function() {
    this.initialize.apply(this, arguments);
};

Vanguard.prototype = new UnitSprite();

Vanguard.prototype.__super = UnitSprite.prototype;

Vanguard.prototype.initialize = function(entity) {
    this.__super.initialize.apply(this, arguments);
    this.walkDuration = 900;
    this.animation = new createjs.BitmapAnimation(spriteSheet);
    this.container.addChild(this.animation);
    this.animation.gotoAndPlay('idle');
    /** Sequence Events **/
};

Vanguard.prototype.moveStart = function() {
    this.animation.gotoAndPlay('move_start');
    this.__super.moveStart.apply(this, arguments);
};

Vanguard.prototype.moveEnd = function() {
    this.animation.gotoAndPlay('move_end');
    this.__super.moveEnd.apply(this, arguments);
};

Vanguard.prototype.damageStart = function() {
    this.animation.gotoAndPlay('defend_start');
    this.__super.damageStart.apply(this, arguments);
};

Vanguard.prototype.damageEnd = function() {
    this.animation.gotoAndPlay('defend_end');
    this.__super.damageEnd.apply(this, arguments);
};

Vanguard.prototype.damage = function() {
    this.animation.gotoAndPlay('hit');
    this.__super.damage.apply(this, arguments);
};

Vanguard.prototype.actStart = function() {
    var _this = this;
    this.animation.gotoAndPlay('attack');
    var act = this.act.bind(this);
    createjs.Tween.get(this)
        .wait(900).call(act)
        .wait(900).call(act)
        .wait(200).call(function() {
            _this.actEnd();
        })
        ;
}

Vanguard.prototype.die = function() {
    this.animation.gotoAndPlay('die_start');
    this.__super.die.apply(this, arguments);
};

module.exports = Vanguard;
