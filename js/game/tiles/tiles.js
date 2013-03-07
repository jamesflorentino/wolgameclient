var Tile = require('./tile');

var Tiles = function() {
    this.initialize.apply(this, arguments);
};

/**
 * @method initialize
 * @protected
 * @param columns
 * @param rows
 */
Tiles.prototype.initialize = function(columns, rows) {
    this.columns = columns;
    this.rows = rows;
    this.matrix = [];
    for(var countY = 0; countY < this.rows; countY++) {
        this.matrix.push([]);
        for(var countX = 0; countX < this.columns; countX++) {
            var tile = new Tile(countX, countY);
            this.matrix[countY].push(tile);
        }
    }
};

/**
 * @method get
 * @param {number} x
 * @param {number} y
 * @return {Tile}
 */
Tiles.prototype.get = function(x, y) {
    var tile;
    if (this.matrix[y]) {
        tile = this.matrix[y][x];
    }
    return tile;
};

/**
 * @method each
 * @param {function} fn
 */
Tiles.prototype.each = function(fn) {
    if (typeof fn === 'function') {
        for(var countY = 0; countY < this.rows; countY++) {
            for(var countX = 0; countX < this.columns; countX++) {
                var tile = this.matrix[countY][countX];
                fn.call(this, tile);
            }
        }
    }
};

/**
 * @param {Tile} tile
 * @return {Array}
 */
Tiles.prototype.neighbors = function(tile) {
    /** TODO: main usage is in hex-tiles.js **/
    return [tile];
};

/**
 * Returns a list of arrays via the path-finding algorithm.
 * @method findPath
 * @param {Tile} start starting tile
 * @param {Tile} end target tile
 * @return {Array}
 */
Tiles.prototype.findPath = function(start, end) {
    var openList,
        closedList,
        currentNode,
        neighbors,
        neighbor,
        scoreG,
        scoreGBest,
        i,
        _len;
    openList = [start];
    closedList = [];
    while(openList.length) {
        var lowestIndex = 0;
        for(i=0,_len = openList.length; i < _len; i++) {
            if (openList[i].f < openList[lowestIndex].f) {
                lowestIndex = i;
            }
        }
        currentNode = openList[lowestIndex];
        // case END: The result has been found.
        if (currentNode.pos() === end.pos()) {
            var current = currentNode;
            var parent;
            var tiles = [];
            while (current.parent) {
                tiles.push(current);
                parent = current.parent; // capture the parent element.
                current.parent = null; // clear the tile's parent
                current = parent; // move to the next parent
            }
            return tiles.reverse();
        }
        // case DEFAULT: Move current node to the closed list.
        openList.splice(currentNode, 1);
        closedList.push(currentNode);
        // Find the best score in the neighboring tile of the hex.
        neighbors = this.neighbors(currentNode);
        for(i=0, _len = neighbors.length; i < _len; i++) {
            neighbor = neighbors[i];
            if (closedList.indexOf(neighbor) > -1 || neighbor.entity) {
                continue;
            }
            scoreG = currentNode.g + 1;
            scoreGBest = false;
            // if it's the first time to touch this tile.
            if(openList.indexOf(neighbor) === -1) {
                scoreGBest = true;
                neighbor.h = this.euclidean(neighbor, end);
                openList.push(neighbor);
            }
            else if (scoreG < neighbor.g) {
                scoreGBest = true;
            }
            if (scoreGBest) {
                neighbor.parent = currentNode;
                neighbor.g = scoreG;
                neighbor.f = neighbor.g + neighbor.h;
            }
        }
    }
    return [];
};

/**
 * @method create
 * @static
 * @param {number} cols
 * @param {number} rows
 * @return {Tiles}
 */
Tiles.create = function(cols, rows) {
    return new Tiles(cols, rows);
};

module.exports = Tiles;
