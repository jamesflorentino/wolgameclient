var Tiles = require('./tiles');
var Tile = require('./tile');

var HexTiles = function() {
    this.initialize.apply(this, arguments);
};

HexTiles.prototype = new Tiles();

/**
 * @property EAST
 * @type {String}
 */
HexTiles.prototype.EAST = 'east';

/**
 * @property WEST
 * @type {String}
 */
HexTiles.prototype.WEST = 'west';

/**
 * @property SOUTHEAST
 * @type {String}
 */
HexTiles.prototype.SOUTHEAST = 'southEast';

/**
 * @property NORTHEAST
 * @type {String}
 */
HexTiles.prototype.NORTHEAST = 'northEast';

/**
 * @property SOUTHWEST
 * @type {String}
 */
HexTiles.prototype.SOUTHWEST = 'southWest';

/**
 * @property NORTHWEST
 * @type {String}
 */
HexTiles.prototype.NORTHWEST = 'northWest';

/**
 * Calculates the adjacent x coordinate based on index and radius
 * @param {string} direction
 * @param {boolean} isOddRow
 * @param {number} index
 * @param {number} i
 * @return {Number}
 */
HexTiles.prototype.deltaX = function(direction, isOddRow, index, i) {
    var result;
    if (index === null) {
        index = 1;
    }
    if (i === null) {
        i = 0;
    }
    result = 0;
    switch (direction) {
        case this.EAST:
            result += (isOddRow ? Math.floor(i * 0.5) * -1 : Math.ceil(i * 0.5) * -1) + index;
        break;
        case this.WEST:
            result += (isOddRow ? Math.ceil(i * 0.5) : Math.floor(i * 0.5)) - index;
        break;
        case this.SOUTHEAST:
            result += (isOddRow ? Math.ceil(index * 0.5) : Math.floor(index * 0.5)) - i;
        break;
        case this.NORTHEAST:
            result += Math.floor(index * 0.5) + i - Math.floor(i * 0.5);
        if (isOddRow) {
            if (index % 2 && (index + i) % 2) {
                result++;
            }
        } else {
            if (index % 2 === 0 && (index + i) % 2) {
                result--;
            }
        }
        break;
        case this.SOUTHWEST:
            result -= Math.ceil(index * 0.5) + i - Math.ceil(i * 0.5);
        if (isOddRow) {
            if (index % 2 && (index + i) % 2) {
                result++;
            }
        } else {
            if (index % 2 === 0 && (index + i) % 2) {
                result--;
            }
        }
        break;
        case this.NORTHWEST:
            result += (isOddRow ? Math.ceil(index * -0.5) : Math.floor(index * -0.5)) + i;
    }
    return result;
};

/**
 * Calculates the adjacent y coordinate based on index and radius
 * @param {string} direction
 * @param {boolean} isOddRow
 * @param {number} index
 * @param {number} i
 * @return {Number}
 */
HexTiles.prototype.deltaY = function(direction, isOddRow, index, i) {
    var result;
    if (index === null) {
        index = 1;
    }
    if (i === null) {
        i = 0;
    }
    result = 0;
    switch (direction) {
        case this.EAST:
            result += i;
        break;
        case this.WEST:
            result += i * -1;
        break;
        case this.SOUTHEAST:
            result += index;
        break;
        case this.SOUTHWEST:
            result += index - i;
        break;
        case this.NORTHEAST:
            result += (index * -1) + i;
        break;
        case this.NORTHWEST:
            result += index * -1;
    }
    return result;
};

/**
 * Returns the delta of a coordinate based on the direction
 * @param {number} centerX
 * @param {number} centerY
 * @param {string} direction
 * @param {boolean} isOddRow
 * @param {number} index
 * @return {Array}
 */
HexTiles.prototype.delta = function(centerX, centerY, direction, isOddRow, index) {
    var i, result, tile, dx, dy;
    result = [];
    for (i = 1; 1 <= index ? i <= index : i >= index; 1 <= index ? i++ : i--) {
        dx = centerX + this.deltaX(direction, isOddRow, index, i - 1);
        dy = centerY + this.deltaY(direction, isOddRow, index, i - 1);
        tile = this.get(dx, dy);
        if (tile) {
            result.push(tile);
        }
    }
    return result;
};

/**
 * Gets the adjacent neighbors in a hex-like environment
 * @param {object} tile
 * @param {number} [radius=1]
 * @return {Array}
 */
HexTiles.prototype.neighbors = function(tile, radius) {
    var centerX, centerY, east, i, isOddRow, result, northEast, northWest, southEast, southWest, west;
    if (tile instanceof Tile) {
        if (typeof radius !== 'number') {
            radius = 1;
        }
        centerX = tile.x;
        centerY = tile.y;
        result = [];
        isOddRow = centerY % 2 > 0;
        if (radius > 0) {
            for (i = 1; 1 <= radius ? i <= radius : i >= radius; 1 <= radius ? i++ : i--) {
                east = this.delta(centerX, centerY, this.EAST, isOddRow, i);
                result = result.concat(east);
                west = this.delta(centerX, centerY, this.WEST, isOddRow, i);
                result = result.concat(west);
                southEast = this.delta(centerX, centerY, this.SOUTHEAST, isOddRow, i);
                result = result.concat(southEast);
                northEast = this.delta(centerX, centerY, this.NORTHEAST, isOddRow, i);
                result = result.concat(northEast);
                southWest = this.delta(centerX, centerY, this.SOUTHWEST, isOddRow, i);
                result = result.concat(southWest);
                northWest = this.delta(centerX, centerY, this.NORTHWEST, isOddRow, i);
                result = result.concat(northWest);
            }

        }
    } else {
        throw(new Error('tile should be an instance of Tile'));
    }

    return result;
};

HexTiles.prototype.findMovementCost = function(start, end) {
    return end.entities.length || end.wall ? 10000 : end.val();
};

HexTiles.prototype.findRange = function(tile, limit) {
    var open = [tile];
    var closed = [];
    var currTile;
    var neighbors;
    var neighbor, newCost, i, _len;

    while(open.length > 0) {
        currTile = open.pop();
        closed.push(currTile);
        if (currTile.cost < limit) {
            neighbors = this.neighbors(currTile);
            _len = neighbors.length;
            for(i = 0; i < _len; i++) {
                neighbor = neighbors[i];
                newCost = currTile.cost + this.findMovementCost(currTile, neighbor);
                if (neighbor.blocked(currTile) || currTile.blocked(neighbor)) {
                    continue;
                }
                if (neighbor.cost === -1 || newCost < neighbor.cost) {
                    neighbor.cost = newCost;
                    if (open.indexOf(neighbor) === -1) {
                        open.push(neighbor);
                    }
                }
            }
        }
    }

    var results = [];
    for(i=0,_len=closed.length; i < _len; i++) {
        currTile = closed[i];
        if (currTile.cost < limit) {
            if (results.indexOf(currTile) === -1) {
                results.push(currTile);
            }
        }
        currTile.cost = -1;
    }
    return results;
};


module.exports= HexTiles;
