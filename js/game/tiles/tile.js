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
    this.cost = -1;
    this.parent = null;
    this.entities = [];
};

Tile.prototype.val = function() {
    return this.entities.length || this.wall ? 1000 : 1;
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
    if (!this.has(entity)) {
        this.entities.push(entity);
    }
};

/**
 * @method vacate
 * @param {Object} entity
 */
Tile.prototype.vacate = function(entity) {
    this.entities.splice(this.entities.indexOf(entity), 1);
};

Tile.prototype.has = function(entity) {
    return this.entities.indexOf(entity) > -1;
}

Tile.create = function() {
    return new Tile();
};
module.exports = Tile;
