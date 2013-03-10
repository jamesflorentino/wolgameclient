var Tile = function() {
    this.initialize.apply(this, arguments);
};
/**
 * @protected
 * @param x
 * @param y
 * @param index
 */
Tile.prototype.initialize = function(x, y, index) {
    this.x = x;
    this.y = y;
    this.z = index;
    this.f = 0;
    this.g = 0;
    this.h = 0;
    this.parent = null;
    this.entities = [];
};

/**
 * @method json
 * @return {Object}
 */
Tile.prototype.json = function() {
    return {
        x: this.x,
        y: this.y,
        z: this.z
    };
};

/**
 * @method pos
 * @return {String}
 */
Tile.prototype.pos = function() {
    return this.x + "." + this.y;
};

/**
 * @method occupy
 * @param {Object} entity
 */
Tile.prototype.occupy = function(entity) {
    this.entity = entity;
};

/**
 * @method vacate
 * @param {Object} entity
 */
Tile.prototype.vacate = function(entity) {
    this.entity = null;
};

Tile.create = function() {
    return new Tile();
};
module.exports = Tile;
