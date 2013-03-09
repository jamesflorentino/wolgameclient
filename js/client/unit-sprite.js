/*global createjs */
var UnitSprite = function() {
    this.initialize.apply(this, arguments);
};

UnitSprite.prototype.initialize = function() {
    this.container = new createjs.Container();
};

module.exports = UnitSprite;
