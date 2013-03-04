var Game = require('./game/game');

/**
 * @param {Number} columns
 * @param {Number} rows
 * @param {String} type
 * @return Tiles
 */
function createTiles(columns, rows, type) {
    var ClassFile = type === 'hex' ? HexTiles : Tiles;
    return new ClassFile(columns, rows);
}

/**
 * @param {Object} settings
 */
function createGame(settings) {
    return new Game(settings);
}

module.exports = {
    createTiles: createTiles,
    createGame: createGame
};
