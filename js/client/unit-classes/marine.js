var UnitSprite = require('../unit-sprite');
var frameData = require('../frames/marine');

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


var Marine = function() {
    this.initialize.apply(this, arguments);
};

Marine.prototype = new UnitSprite();

Marine.prototype.__super = UnitSprite.prototype;

Marine.prototype.initialize = function() {
    var _this = this, animationCallbacks;
    this.__super.initialize.apply(this, arguments);
    this.walkDuration = 600;
    this.animation = new createjs.BitmapAnimation(spriteSheet);
    this.container.addChild(this.animation);

    /** animation callbacks **/
    this.endAnimations.on('attack', function() {
        //_this.actEnd();
    });

    this.animation.addEventListener('animationend', function(event) {
        _this.endAnimations.emit(event.name);
    });
    this.animation.gotoAndPlay('idle');
    /** Sequence Events **/
};

Marine.prototype.moveStart = function() {
    this.animation.gotoAndPlay('move_start');
};

Marine.prototype.moveEnd = function() {
    this.animation.gotoAndPlay('move_end');
};

Marine.prototype.actStart = function() {
    var _this = this;
    this.animation.gotoAndPlay('attack');
    var act = this.act.bind(this)
    createjs.Tween.get(this)
        .wait(300).call(act)
        .wait(100).call(act)
        .wait(200).call(act)
        .wait(300).call(function() {
            _this.actEnd();
        })
        ;
};

Marine.prototype.damageStart = function() {
    this.animation.gotoAndPlay('defend_start');
};

Marine.prototype.damageEnd = function() {
    this.animation.gotoAndPlay('defend_end');
};

Marine.prototype.damage = function() {
    this.animation.gotoAndPlay('hit');
};



module.exports = Marine;
