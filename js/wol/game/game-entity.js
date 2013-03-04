var Stats = require('../stats/stats');
var GameEntity = function() {
    this.initialize.apply(this, arguments);
}

GameEntity.prototype.stats = null;
GameEntity.prototype.initialize = function(properties) {
    this.stats = new Stats();
    this.stats.add('health', 100);
    this.stats.add('damage', 10);
    this.stats.add('defense', 10);
    this.stats.add('range', 10);
    this.stats.add('reach', 10);
};

module.exports = GameEntity;
