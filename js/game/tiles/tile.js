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
    this.type = null;
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

Tile.prototype.blocked = function(tile) {
    var x = tile.x;
    var y = tile.y;
    var wall, blocked;
    if (this.walls) {
        for (var i = this.walls.length - 1; i >= 0; i--){
            var wall = this.walls[i];
            if (wall[0] == x && wall[1] === y) {
                blocked = true;
                break;
            }
        };
    }
    return blocked;
};

/**
 * @method vacate
 * @param {Object} entity
 */
Tile.prototype.vacate = function(entity) {
    this.entities.splice(this.entities.indexOf(entity), 1);
};

Tile.prototype.isOccupied = function() {
    return this.entities.length > 0;
};

Tile.prototype.has = function(entity) {
    return this.entities.indexOf(entity) > -1;
};

Tile.create = function() {
    return new Tile();
};
module.exports = Tile;
