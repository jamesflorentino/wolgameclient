var Tile = function() {
    this.initialize.apply(this, arguments);
};

/**
 * X position
 * @type number
 */
Tile.prototype.x = null;

/**
 * Y position
 * @type number
 */
Tile.prototype.y = null;

/**
 * z-index position
 * @type number
 */
Tile.prototype.z = null;

/**
 * F score (path finding stuff)
 * @type number
 */
Tile.prototype.f = null;

/**
 * G score (path finding stuff)
 * @type number
 */
Tile.prototype.g = null;

/**
 * Heuristics score (path finding stuff)
 * @type number
 */
Tile.prototype.h = null;

/**
 * Parent reference
 * @type Tile
 */
Tile.prototype.parent = null;

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
 * @param {object} entity
 */
Tile.prototype.occupy = function(entity) {
    if (this.entities.indexOf(entity) === -1) {
        this.entities.push(entity);
    }
};

/**
 * @method vacate
 * @param {object} entity
 */
Tile.prototype.vacate = function(entity) {
    this.entities.splice(this.entities.indexOf(entity));
};

Tile.create = function() {
    return new Tile();
};
module.exports = Tile;
