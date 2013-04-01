;(function(e,t,n,r){function i(r){if(!n[r]){if(!t[r]){if(e)return e(r);throw new Error("Cannot find module '"+r+"'")}var s=n[r]={exports:{}};t[r][0](function(e){var n=t[r][1][e];return i(n?n:e)},s,s.exports)}return n[r].exports}for(var s=0;s<r.length;s++)i(r[s]);return i})(typeof require!=="undefined"&&require,{1:[function(require,module,exports){// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],2:[function(require,module,exports){(function(process){if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;
function indexOf (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) {
        if (x === xs[i]) return i;
    }
    return -1;
}

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = indexOf(list, listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  if (arguments.length === 0) {
    this._events = {};
    return this;
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

})(require("__browserify_process"))
},{"__browserify_process":1}],3:[function(require,module,exports){module.exports = [
    { id: 'background', src: 'media/backgrounds/fiery-skies.png' },
    { id: 'common', src: 'media/common.png' },
    { id: 'foreground', src: 'media/foreground.png' }
];

},{}],4:[function(require,module,exports){module.exports = {
    backgroundURI: '/media/backgrounds/teal.png',
    terrainURI: '/media/terrains/gravel.png',
    terrainX: 25,
    terrainY: 100,
    rows: 8,
    columns: 10,
    numberSpacing: {
        '0': 21,
        '1': 15,
        '2': 21,
        '3': 21,
        '4': 21,
        '5': 21,
        '6': 20,
        '7': 20,
        '8': 21,
        '9': 20
    }
};

},{}],5:[function(require,module,exports){var base = [
    //{ x: 4, y: 0, wall: 1 },
    //{ x: 4, y: 1, wall: 1 },
    { x: 3, y: 3, defense: 50, walls: [[4,3]]},
    { x: 3, y: 4, attack: 150},
    { x: 1, y: 4, defense: 150},
    //{ x: 4, y: 2, wall: 1, type: 'wall0' },
    //{ x: 4, y: 3, wall: 1 },
    //{ x: 4, y: 4, wall: 1 },
    { x: 0, y: 2, wall: 1, type: 'spawnpoint', spawn: 1, offsetdepth: -1},
    { x: 0, y: 6, wall: 1, type: 'spawnpoint', spawn: 1, offsetdepth: -1}
    //{ x: 4, y: 0, wall: 1, type: 'wall0' },
    //{ x: 4, y: 1, wall: 1, type: 'wall0' },
    //{ x: 4, y: 2, wall: 1, type: 'wall0' },
    //{ x: 4, y: 5, wall: 1, type: 'wall0' },
    //{ x: 5, y: 6, wall: 1, type: 'wall0' },
    //{ x: 4, y: 7, wall: 1, type: 'wall0' }
    //{ x: 4, y: 6, wall: 1 },
];
module.exports = base;

},{}],6:[function(require,module,exports){var logs = require('../logs');

function clientEvents(game, client, socket) {
    client.on('input:move', function(data) {
        socket.emit('unit:turn', {
            c: 'move',
            id: data.entity.id,
            x: data.tile.x,
            y: data.tile.y
        });
    });
    client.on('input:act', function(data) {
        socket.emit('unit:turn', {
            c: 'act',
            id: data.entity.id,
            target: data.target.id,
            command: data.command.id,
            x: data.tile.x,
            y: data.tile.y
        });
    });
    client.on('input:skip', function() {
        socket.emit('unit:turn', {
            c: 'skip'
        });
    });
}

module.exports = clientEvents;

},{"../logs":7}],8:[function(require,module,exports){var logs = require('../logs');
var EventEmitter = require('events').EventEmitter;
var unitTypes = require('../game/unit-types');

function gameRoutes(socket, game) {
    var log = logs('#logs');
    var routes = new EventEmitter();

    routes.on('unit:move', function(data) {
        var options = {
            id: data.id,
            x: data.x,
            y: data.y,
            sync: data.sync
        };
        game.getEntity(options.id, function(entity) {
            game.tiles.get(options.x, options.y, function(tile) {
                game.moveEntity(entity, tile, data.sync);
                log('move: ', entity.type , '(' + entity.id + ')', 'x:', entity.tile.x, 'y:', entity.tile.y);
            });
        });
    });

    routes.on('unit:act', function(data) {
        game.getEntity(data.id, function(entity) {
            game.tiles.get(data.x, data.y, function(tile) {
                entity.commands.get(data.type, function(command) {
                    var target = game.getEntity(data.target);
                    game.actEntity(entity, tile, command, target);
                    log('act: ', entity.type , '(' + entity.id + ')', 'x:', tile.x, 'y:', tile.y);
                });
            });
        });
    });

    routes.on('unit:create', function(data) {
        var options = {
            id: data.id,
            type: data.target,
            x: data.x,
            y: data.y,
            attributes: unitTypes[data.target]
        };
        game.spawnEntity(options, function(entity) {
            log('new entity', entity.type , '(' + entity.id + ')', 'x:', entity.tile.x, 'y:', entity.tile.y);
        });
    });

    routes.on('unit:enable', function(data) {
        var options = {
            id: data.id,
            x: data.x,
            y: data.y
        };
        game.getEntity(options.id, function(entity) {
            game.setTurn(entity);
            log('enable: ', entity.type , '(' + entity.id + ')', 'x:', entity.tile.x, 'y:', entity.tile.y);
        });
    });

    routes.on('unit:disable', function(data) {
        var options = {
            id: data.id,
            x: data.x,
            y: data.y
        };
        game.getEntity(options.id, function(entity) {
            game.endTurn(entity);
            log('disable: ', entity.type , '(' + entity.id + ')', 'x:', entity.tile.x, 'y:', entity.tile.y);
        });
    });

    socket.on('warning', function(o) {
        console.log(o);
    });

    socket.on('unit/turn', function(data) {
        routes.emit('unit:' + data.c, data);
    });
}

module.exports = gameRoutes;

},{"events":2,"../logs":7,"../game/unit-types":9}],10:[function(require,module,exports){var Tile = function() {
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

},{}],11:[function(require,module,exports){(function(){var EventEmitter = require('events').EventEmitter;
/*global createjs*/
var Preloader = function() {
    this.manifest = [];
};

Preloader.prototype = new EventEmitter();

Preloader.prototype.load = function(manifest, callback) {
    var queue = new createjs.LoadQueue();
    var _this = this;
    this.queue = queue;
    queue.addEventListener('progress', function(e){
        _this.emit('progress', e);
    });
    queue.addEventListener('complete', function(e) {
        _this.emit('progress', e);
        callback();
    });
    queue.loadManifest(manifest);
};

Preloader.prototype.getResource = function(idOrURL) {
    return this.queue.getResult(idOrURL);
};

module.exports = Preloader;

})()
},{"events":2}],12:[function(require,module,exports){var HexUtil = {
    WIDTH: 81,
    HEIGHT: 60,
    position: function(hex, tile, center) {
        var coord = this.coord(tile, center);
        hex.regX = this.WIDTH * 0.5;
        hex.regY = this.HEIGHT * 0.5;
        hex.x = coord.x + hex.regX;
        hex.y = coord.y + hex.regY;
        return coord;
    },
    coord: function(tile, center) {
        if (tile === undefined) {
            return null;
        }
        return {
            x: tile.x * this.WIDTH+ (tile.y % 2 ? this.WIDTH * 0.5 : 0) + (center ? this.WIDTH * 0.5 : 0),
            y: tile.y * (this.HEIGHT - this.HEIGHT * 0.25) + (center ? this.HEIGHT * 0.5 : 0)
        };
    }
};

module.exports = HexUtil;

},{}],13:[function(require,module,exports){module.exports = {
    'wall0': {
        regY: 25,
    },
    'cover0-a': {
        regX: -38,
        regY: 8
    },
    'show-unit-info': {
        regX: 12,
        regY: 20
    }
};

},{}],14:[function(require,module,exports){module.exports = function(time, fn) {
    setTimeout(fn, time);
};

},{}],15:[function(require,module,exports){var EventEmitter = require('events').EventEmitter;
var KeyManager = function() {
};

KeyManager.prototype.init = function(document) {
    this.down = new EventEmitter();
    this.up = new EventEmitter();
    var _this = this;
    document.addEventListener('keydown', function(e) {
        _this.down.emit(e.keyCode, e);
    });
    document.addEventListener('keyup', function(e) {
        _this.up.emit(e.keyCode, e);
    });
};


module.exports = new KeyManager();

},{"events":2}],9:[function(require,module,exports){module.exports = {
    powernode: {
        data: {
            name: 'Power Node',
            role: 'Resource point',
            description: 'Power nodes provide steady flow of resources. ' +
                'If you destroy the power node of an enemy, you win the game.'
        },
        stats: {
            health: 100,
            turnspeed: 0
    },
    commands: {
        rally: {
            damage: 0
        }
        }
    },
    vanguard: {
        data: {
            name: 'Lemurian Vanguard',
            role: 'Heavy/Defense',
            description: 'The Vanguard can best defend the frontline and' +
                ' hit multiple enemies at once due to its splash damage at the expense of its limited firing range. '
        },
        stats: {
            range: 2,
            defense: 50,
            health: 800
        },
        commands: {
            dualshot: {
                damage: 300,
                range: 2,
                cooldown: 0,
                splash: 1
            }
        }
    },
    marine: {
        type: 'marine',
        data: {
            name: 'Lemurian Marine',
            role: 'Assault',
            description: 'The assault marine is perfect for ' +
                'attacking power nodes and basic infantry units due to its long range. ' +
                'Has average life. Ineffective against armored units.'
        },
        stats: {
            range: 2,
            splash: 1
        },
        commands: {
            rifleshot: {
                damage: 250,
                range: 3,
                cooldown: 0,
                splash: 0
            }
        }
    }
};

},{}],7:[function(require,module,exports){function logs(id, clearAfterInput) {
    var log = document.querySelector(id);
    log.innerHTML = '';
    return function() {
        var message = Array.prototype.join.call(arguments, ' ');
        if (clearAfterInput) {
            log.innerHTML = message + '<br>';
        } else {
            log.innerHTML +=  message + '<br>';
        }

    }
}

module.exports = logs;

},{}],16:[function(require,module,exports){var Tiles = require('./tiles');
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

},{"./tiles":17,"./tile":10}],18:[function(require,module,exports){var Stats = require('./stats/stats');
var Commands = require('./commands/commands');
var EventEmitter = require('events').EventEmitter;

var GameEntity = function() {
    this.initialize.apply(this, arguments);
};

GameEntity.prototype = new EventEmitter();

GameEntity.prototype.id = null;
GameEntity.prototype.type = null;
GameEntity.prototype.stats = null;
GameEntity.prototype.commands = null;
GameEntity.prototype.state = null;

GameEntity.prototype.initialize = function(id) {
    this.id = id;
    this.data = {};
    this.stats = new Stats();
    // hit points
    this.stats.add('health', 800, 800);
    // armor points
    this.stats.add('defense', 0);
    // range
    this.stats.add('range', 1, 1);
    // how fast their turn gauge fill ups
    this.stats.add('turnspeed', 1);
    // turn points
    this.stats.add('turn', 0, 10);
    // actions
    this.stats.add('actions', 0, 5);
    this.commands = new Commands();
    this.tile = null;
};

GameEntity.prototype.set = function(attributes) {
    if (typeof attributes === 'object') {
        if (attributes.hasOwnProperty('commands')) {
            this.commands.set(attributes.commands);
        }
        if (attributes.hasOwnProperty('stats')) {
            this.stats.set(attributes.stats);
        }
        if (attributes.hasOwnProperty('data')) {
            this.data = attributes.data;
        }
    }
};

GameEntity.prototype.move = function(tile, sync) {
    var prevTile = this.tile;
    this.prevTile = this.tile;
    this.tile = tile;
    if (sync) {
        this.emit('move:update', tile);
    } else {
        this.emit('move:start', tile);
    }

    if (prevTile) {
        prevTile.vacate(this);
    }
    tile.occupy(this);
};

GameEntity.prototype.damage = function(damage) {
    this.stats.get('health').reduce(damage);
    this.emit('damage', damage);
};

GameEntity.prototype.enable = function() {
    this.emit('enable');
};

GameEntity.prototype.disable = function() {
    this.emit('disable');
};

GameEntity.prototype.die = function() {
    this.emit('die');
};

GameEntity.prototype.isDead = function() {
    return this.stats.get('health').val() === 0;
};

/**
 * The index parameter will be the basis for the splash damage calculation
 * @param {GameEntity} target entity
 * @param {Command} command target comand
 * @param {Number} index
 */
GameEntity.prototype.act = function(target, command, index) {
    var health, defense, damage, status, tile;
    health = target.stats.get('health').val();
    defense = target.stats.get('defense').val();
    damage = command.damage;

    /** target defense bonuses **/
    if (typeof target.tile.defense === 'number') {
        defense += target.tile.defense;
    }

    /** entity attack bonuses **/
    if (typeof this.tile.attack === 'number') {
        damage += this.tile.attack;
    }

    // apply splash index bonuses
    damage = index > 0 ? damage * 0.5 : damage;
    damage = Math.max(0, damage - defense);
    status = 'damage';

    if (health - damage <= 0) {
        status = 'death';
    }

    this.emit('act', {
        target: target,
        command: command
    });
    return {
        damage: damage,
        status: status
    };
};

GameEntity.create = function(id, fn) {
    var entity = new GameEntity(id);
    if (typeof fn === 'function') {
        fn(entity);
    }
    return entity;
};

module.exports = GameEntity;

},{"events":2,"./stats/stats":19,"./commands/commands":20}],21:[function(require,module,exports){module.exports = {
    marine: require('./marine'),
    vanguard: require('./vanguard'),
    common: require('./common'),
    particles: require('./particles'),
    foreground: require('./foreground')
};

},{"./marine":22,"./vanguard":23,"./common":24,"./particles":25,"./foreground":26}],27:[function(require,module,exports){var UnitSprite = require('../unit-sprite');
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
    this.__super.moveEnd.apply(this, arguments);
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

Marine.prototype.die = function() {
    this.animation.gotoAndPlay('die_start');
};



module.exports = Marine;

},{"../unit-sprite":28,"../frames/marine":22}],29:[function(require,module,exports){var UnitSprite = require('../unit-sprite');
var frameData = require('../frames/vanguard');

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

var Vanguard = function() {
    this.initialize.apply(this, arguments);
};

Vanguard.prototype = new UnitSprite();

Vanguard.prototype.__super = UnitSprite.prototype;

Vanguard.prototype.initialize = function(entity) {
    this.__super.initialize.apply(this, arguments);
    this.walkDuration = 900;
    this.animation = new createjs.BitmapAnimation(spriteSheet);
    this.container.addChild(this.animation);
    this.animation.gotoAndPlay('idle');
    /** Sequence Events **/
};

Vanguard.prototype.moveStart = function() {
    this.animation.gotoAndPlay('move_start');
};

Vanguard.prototype.moveEnd = function() {
    this.animation.gotoAndPlay('move_end');
    this.__super.moveEnd.apply(this, arguments);
};

Vanguard.prototype.damageStart = function() {
    this.animation.gotoAndPlay('defend_start');
};

Vanguard.prototype.damageEnd = function() {
    this.animation.gotoAndPlay('defend_end');
};

Vanguard.prototype.damage = function() {
    this.animation.gotoAndPlay('hit');
};

Vanguard.prototype.actStart = function() {
    var _this = this;
    this.animation.gotoAndPlay('attack');
    var act = this.act.bind(this);
    createjs.Tween.get(this)
        .wait(900).call(act)
        .wait(900).call(act)
        .wait(200).call(function() {
            _this.actEnd();
        })
        ;
}

Vanguard.prototype.die = function() {
    this.animation.gotoAndPlay('die_start');
};

module.exports = Vanguard;

},{"../unit-sprite":28,"../frames/vanguard":23}],30:[function(require,module,exports){var UnitSprite = require('../unit-sprite');
var frameData = require('../frames/powernode');

var spriteSheet = new createjs.SpriteSheet(frameData);

spriteSheet.getAnimation('hit').next = 'idle';
spriteSheet.getAnimation('death').next = null;

var PowerNode = function() {
    this.initialize.apply(this, arguments);
};

PowerNode.prototype = new UnitSprite();
PowerNode.prototype.__super = UnitSprite.prototype;
PowerNode.prototype.initialize = function(entity) {
    this.__super.initialize.apply(this, arguments);
    this.animation = new createjs.BitmapAnimation(spriteSheet);
    this.container.addChild(this.animation);
    this.animation.gotoAndPlay('idle');
};

PowerNode.prototype.face = function(direction) {
    this.__super.face.call(this, direction, true);
};

PowerNode.prototype.damage = function() {
    this.animation.gotoAndPlay('hit');
};

PowerNode.prototype.die = function() {
    this.animation.gotoAndPlay('death');
};

module.exports = PowerNode;



},{"../unit-sprite":28,"../frames/powernode":31}],22:[function(require,module,exports){module.exports = {
    "frames": [
        [1528, 0, 52, 78, 0, 18, 68],
        [1015, 0, 52, 78, 0, 18, 68],
        [963, 0, 52, 78, 0, 18, 68],
        [911, 0, 52, 78, 0, 18, 68],
        [859, 0, 52, 78, 0, 18, 68],
        [310, 86, 52, 77, 0, 18, 67],
        [258, 86, 52, 77, 0, 18, 67],
        [206, 86, 52, 77, 0, 18, 67],
        [155, 86, 51, 77, 0, 18, 67],
        [104, 86, 51, 77, 0, 18, 67],
        [1992, 0, 52, 77, 0, 18, 67],
        [1940, 0, 52, 77, 0, 18, 67],
        [52, 86, 52, 77, 0, 18, 67],
        [1888, 0, 52, 77, 0, 18, 67],
        [1733, 0, 52, 77, 0, 18, 67],
        [1836, 0, 52, 77, 0, 18, 67],
        [1220, 0, 52, 78, 0, 18, 68],
        [1272, 0, 52, 78, 0, 18, 68],
        [1324, 0, 52, 78, 0, 18, 68],
        [1376, 0, 51, 78, 0, 18, 68],
        [482, 163, 52, 71, 0, 16, 62],
        [914, 163, 55, 68, 0, 17, 59],
        [1023, 163, 57, 66, 0, 19, 58],
        [969, 163, 54, 67, 0, 17, 58],
        [744, 163, 52, 69, 0, 15, 59],
        [378, 163, 52, 71, 0, 15, 60],
        [430, 163, 52, 71, 0, 15, 59],
        [271, 163, 53, 72, 0, 15, 58],
        [1955, 86, 55, 73, 0, 18, 58],
        [534, 163, 53, 71, 0, 16, 58],
        [692, 163, 52, 69, 0, 15, 58],
        [587, 163, 52, 70, 0, 15, 59],
        [796, 163, 52, 68, 0, 15, 58],
        [1080, 163, 53, 66, 0, 15, 58],
        [639, 163, 53, 70, 0, 16, 61],
        [1733, 86, 52, 73, 0, 17, 64],
        [1785, 0, 51, 77, 0, 18, 67],
        [1631, 0, 50, 77, 0, 17, 67],
        [1427, 0, 50, 78, 0, 17, 68],
        [1067, 0, 50, 78, 0, 17, 68],
        [572, 86, 53, 75, 0, 18, 64],
        [1007, 86, 56, 74, 0, 19, 61],
        [1677, 86, 56, 73, 0, 19, 60],
        [1898, 86, 57, 73, 0, 19, 59],
        [1841, 86, 57, 73, 0, 19, 59],
        [1785, 86, 56, 73, 0, 19, 59],
        [633, 0, 102, 86, 0, 19, 72],
        [531, 0, 102, 86, 0, 19, 72],
        [102, 0, 102, 86, 0, 19, 72],
        [735, 0, 124, 86, 0, 19, 72],
        [321, 0, 102, 86, 0, 19, 72],
        [0, 0, 102, 86, 0, 19, 72],
        [423, 0, 108, 86, 0, 19, 72],
        [204, 0, 117, 86, 0, 19, 72],
        [1284, 86, 56, 73, 0, 19, 59],
        [1620, 86, 57, 73, 0, 19, 59],
        [1340, 86, 57, 73, 0, 19, 59],
        [1226, 86, 58, 73, 0, 19, 59],
        [1507, 86, 58, 73, 0, 19, 60],
        [895, 86, 57, 75, 0, 19, 62],
        [786, 86, 56, 75, 0, 19, 63],
        [842, 86, 53, 75, 0, 18, 64],
        [467, 86, 52, 76, 0, 18, 65],
        [362, 86, 52, 77, 0, 18, 66],
        [1168, 0, 52, 78, 0, 18, 67],
        [1117, 0, 51, 78, 0, 18, 68],
        [1580, 0, 51, 78, 0, 18, 68],
        [1477, 0, 51, 78, 0, 18, 68],
        [414, 86, 53, 77, 0, 18, 65],
        [625, 86, 54, 75, 0, 18, 62],
        [1117, 86, 55, 74, 0, 18, 60],
        [952, 86, 55, 74, 0, 18, 59],
        [1397, 86, 55, 73, 0, 18, 58],
        [1452, 86, 55, 73, 0, 18, 58],
        [217, 163, 54, 72, 0, 19, 57],
        [0, 163, 53, 72, 0, 18, 57],
        [53, 163, 54, 72, 0, 18, 57],
        [324, 163, 54, 72, 0, 18, 57],
        [162, 163, 55, 72, 0, 18, 57],
        [1565, 86, 55, 73, 0, 18, 59],
        [1172, 86, 54, 74, 0, 18, 60],
        [1063, 86, 54, 74, 0, 18, 61],
        [679, 86, 54, 75, 0, 18, 62],
        [733, 86, 53, 75, 0, 18, 63],
        [519, 86, 53, 76, 0, 18, 65],
        [1681, 0, 52, 77, 0, 18, 66],
        [0, 86, 52, 77, 0, 18, 67],
        [107, 163, 55, 72, 0, 23, 57],
        [1133, 163, 59, 65, 0, 28, 50],
        [1388, 163, 61, 62, 0, 30, 48],
        [1324, 163, 64, 62, 0, 30, 48],
        [1258, 163, 66, 62, 0, 30, 48],
        [848, 163, 66, 68, 0, 30, 48],
        [1192, 163, 66, 65, 0, 30, 48],
        [1515, 163, 66, 62, 0, 30, 48],
        [1449, 163, 66, 62, 0, 30, 47],
        [1581, 163, 65, 60, 0, 29, 45],
        [1646, 163, 65, 58, 0, 29, 42],
        [1711, 163, 64, 50, 0, 28, 32],
        [1775, 163, 69, 43, 0, 27, 23],
        [1844, 163, 79, 34, 0, 26, 14],
        [79, 235, 79, 33, 0, 26, 13],
        [1923, 163, 79, 33, 0, 26, 13],
        [0, 235, 79, 33, 0, 26, 13],
        [237, 235, 79, 33, 0, 26, 13],
        [158, 235, 79, 33, 0, 26, 13],
        [395, 235, 79, 32, 0, 26, 12],
        [316, 235, 79, 32, 0, 26, 12],
        [474, 235, 79, 32, 0, 26, 12],
        [553, 235, 79, 31, 0, 26, 11]
    ],
    "animations": {
        "defend_start": {"frames": [0, 68, 69, 70, 71, 72]},
        "all": {"frames": [0]},
        "move": {"frames": [22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33]},
        "die_end": {"frames": [109]},
        "die_start": {"frames": [0, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108]},
        "move_end": {"frames": [22, 34, 35, 36, 37, 38, 39]},
        "idle": {"frames": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]},
        "attack": {"frames": [0, 40, 41, 42, 43, 44, 45, 46, 47, 45, 46, 48, 45, 49, 50, 45, 51, 52, 45, 46, 53, 54, 45, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67]},
        "defend_end": {"frames": [73, 79, 80, 81, 82, 83, 84, 85, 86]},
        "move_start": {"frames": [0, 20, 21]},
        "hit": {"frames": [74, 75, 76, 77, 78]},
        "defend_hold": {"frames": [73]}
    },
    "images": ["media/marine.png"]
};

},{}],23:[function(require,module,exports){module.exports = {
    "frames": [
        [68, 313, 60, 94, 0, 33, 76],
        [1541, 219, 60, 94, 0, 33, 76],
        [1481, 219, 60, 94, 0, 33, 76],
        [1421, 219, 60, 94, 0, 33, 76],
        [712, 313, 60, 93, 0, 33, 75],
        [772, 313, 60, 93, 0, 33, 75],
        [832, 313, 60, 93, 0, 33, 75],
        [892, 313, 60, 93, 0, 33, 75],
        [952, 313, 60, 93, 0, 33, 75],
        [1012, 313, 60, 93, 0, 33, 75],
        [1072, 313, 60, 93, 0, 33, 75],
        [1603, 407, 60, 92, 0, 33, 74],
        [1798, 407, 60, 92, 0, 33, 74],
        [1858, 407, 60, 92, 0, 33, 74],
        [64, 500, 60, 92, 0, 33, 74],
        [309, 500, 60, 92, 0, 33, 74],
        [1132, 313, 60, 93, 0, 33, 75],
        [1192, 313, 60, 93, 0, 33, 75],
        [1252, 313, 60, 93, 0, 33, 75],
        [1312, 313, 60, 93, 0, 33, 75],
        [1372, 313, 60, 93, 0, 33, 75],
        [1432, 313, 60, 93, 0, 33, 75],
        [1620, 313, 60, 93, 0, 33, 75],
        [1680, 313, 60, 93, 0, 33, 75],
        [1361, 219, 60, 94, 0, 33, 76],
        [146, 219, 60, 94, 0, 33, 76],
        [1963, 119, 60, 94, 0, 33, 76],
        [1306, 219, 55, 94, 0, 28, 76],
        [369, 500, 58, 92, 0, 29, 76],
        [1901, 313, 61, 93, 0, 30, 76],
        [1962, 313, 64, 93, 0, 32, 75],
        [639, 219, 66, 94, 0, 33, 76],
        [1492, 313, 66, 93, 0, 33, 76],
        [57, 407, 66, 93, 0, 33, 76],
        [123, 407, 64, 93, 0, 33, 75],
        [965, 500, 62, 91, 0, 32, 74],
        [187, 407, 61, 93, 0, 33, 74],
        [1121, 500, 60, 91, 0, 34, 73],
        [1231, 500, 58, 91, 0, 34, 73],
        [1484, 500, 55, 90, 0, 33, 73],
        [427, 500, 50, 92, 0, 31, 74],
        [248, 407, 47, 93, 0, 30, 74],
        [593, 219, 46, 94, 0, 28, 75],
        [1714, 119, 46, 95, 0, 27, 75],
        [423, 219, 46, 94, 0, 28, 74],
        [374, 219, 49, 94, 0, 31, 74],
        [322, 219, 52, 94, 0, 33, 73],
        [295, 407, 60, 93, 0, 35, 73],
        [240, 500, 69, 92, 0, 37, 72],
        [477, 500, 68, 92, 0, 38, 72],
        [812, 500, 68, 91, 0, 40, 72],
        [746, 500, 66, 91, 0, 40, 72],
        [1539, 500, 66, 90, 0, 42, 72],
        [1674, 500, 65, 90, 0, 43, 72],
        [1427, 500, 57, 90, 0, 39, 72],
        [186, 500, 54, 92, 0, 35, 73],
        [355, 407, 53, 93, 0, 30, 74],
        [408, 407, 56, 93, 0, 30, 74],
        [528, 407, 58, 93, 0, 29, 75],
        [1544, 407, 59, 92, 0, 29, 75],
        [685, 500, 61, 91, 0, 30, 75],
        [124, 500, 62, 92, 0, 30, 75],
        [464, 407, 64, 93, 0, 32, 75],
        [0, 500, 64, 92, 0, 32, 75],
        [1976, 407, 61, 92, 0, 30, 76],
        [1918, 407, 58, 92, 0, 29, 76],
        [0, 407, 57, 93, 0, 29, 76],
        [267, 219, 55, 94, 0, 29, 76],
        [1291, 119, 60, 95, 0, 32, 76],
        [529, 219, 64, 94, 0, 33, 76],
        [766, 219, 69, 94, 0, 32, 76],
        [1005, 119, 76, 95, 0, 31, 76],
        [835, 219, 82, 94, 0, 29, 76],
        [1760, 119, 81, 95, 0, 27, 77],
        [446, 119, 83, 96, 0, 28, 77],
        [1220, 219, 86, 94, 0, 29, 76],
        [1748, 219, 84, 94, 0, 27, 76],
        [0, 219, 86, 94, 0, 28, 76],
        [1601, 219, 86, 94, 0, 28, 76],
        [1202, 119, 89, 95, 0, 27, 76],
        [1479, 0, 106, 102, 0, 28, 84],
        [1937, 0, 107, 101, 0, 28, 83],
        [1831, 0, 106, 101, 0, 28, 83],
        [105, 119, 106, 100, 0, 28, 82],
        [0, 119, 105, 100, 0, 28, 82],
        [1722, 0, 109, 101, 0, 28, 83],
        [1126, 0, 113, 105, 0, 28, 87],
        [1009, 0, 117, 108, 0, 28, 90],
        [887, 0, 122, 111, 0, 28, 93],
        [587, 0, 127, 114, 0, 28, 96],
        [144, 0, 132, 118, 0, 28, 100],
        [0, 0, 144, 119, 0, 27, 100],
        [276, 0, 157, 117, 0, 45, 99],
        [433, 0, 154, 114, 0, 61, 97],
        [714, 0, 173, 111, 0, 61, 94],
        [589, 119, 82, 96, 0, 61, 79],
        [1571, 119, 84, 95, 0, 61, 78],
        [1918, 219, 85, 94, 0, 61, 77],
        [1832, 219, 86, 94, 0, 61, 77],
        [1818, 313, 83, 93, 0, 57, 76],
        [1740, 313, 78, 93, 0, 52, 76],
        [640, 313, 72, 93, 0, 46, 76],
        [0, 313, 68, 94, 0, 42, 77],
        [1558, 313, 62, 93, 0, 37, 76],
        [1215, 407, 58, 92, 0, 34, 76],
        [1181, 500, 50, 91, 0, 30, 76],
        [1789, 500, 48, 89, 0, 27, 76],
        [1739, 500, 50, 89, 0, 23, 77],
        [1103, 592, 61, 87, 0, 22, 76],
        [787, 592, 78, 88, 0, 22, 77],
        [945, 592, 79, 87, 0, 22, 76],
        [1024, 592, 79, 87, 0, 22, 76],
        [1164, 592, 79, 87, 0, 22, 76],
        [865, 592, 80, 87, 0, 22, 76],
        [703, 592, 84, 88, 0, 22, 77],
        [555, 592, 89, 88, 0, 22, 77],
        [1027, 500, 94, 91, 0, 22, 80],
        [1351, 119, 99, 95, 0, 22, 84],
        [341, 119, 105, 98, 0, 22, 87],
        [1368, 0, 111, 102, 0, 22, 91],
        [1239, 0, 129, 102, 0, 22, 91],
        [1585, 0, 137, 101, 0, 35, 89],
        [211, 119, 130, 98, 0, 47, 87],
        [671, 119, 149, 96, 0, 47, 84],
        [644, 592, 59, 88, 0, 47, 76],
        [306, 592, 59, 88, 0, 47, 76],
        [494, 592, 61, 88, 0, 47, 76],
        [245, 592, 61, 88, 0, 47, 77],
        [62, 592, 61, 88, 0, 47, 76],
        [0, 592, 62, 88, 0, 47, 76],
        [123, 592, 62, 88, 0, 47, 76],
        [1837, 500, 61, 88, 0, 45, 76],
        [1957, 500, 60, 88, 0, 44, 76],
        [185, 592, 60, 88, 0, 43, 77],
        [1898, 500, 59, 88, 0, 41, 76],
        [444, 592, 50, 88, 0, 34, 76],
        [880, 500, 43, 91, 0, 30, 77],
        [923, 500, 42, 91, 0, 29, 76],
        [2003, 219, 44, 92, 0, 29, 76],
        [195, 313, 51, 93, 0, 32, 76],
        [1165, 219, 55, 94, 0, 33, 76],
        [1107, 219, 58, 94, 0, 33, 76],
        [1655, 119, 59, 95, 0, 32, 76],
        [982, 219, 62, 94, 0, 34, 75],
        [917, 219, 65, 94, 0, 35, 74],
        [128, 313, 67, 93, 0, 36, 73],
        [572, 313, 68, 93, 0, 36, 72],
        [246, 313, 69, 93, 0, 36, 72],
        [586, 407, 69, 92, 0, 36, 71],
        [726, 407, 69, 92, 0, 36, 71],
        [315, 313, 70, 93, 0, 36, 72],
        [795, 407, 71, 92, 0, 37, 71],
        [655, 407, 71, 92, 0, 37, 71],
        [1145, 407, 70, 92, 0, 37, 71],
        [1273, 407, 70, 92, 0, 37, 71],
        [866, 407, 70, 92, 0, 37, 71],
        [936, 407, 69, 92, 0, 36, 71],
        [1005, 407, 70, 92, 0, 37, 71],
        [1075, 407, 70, 92, 0, 37, 71],
        [615, 500, 70, 91, 0, 37, 70],
        [545, 500, 70, 91, 0, 37, 70],
        [1358, 500, 69, 90, 0, 36, 69],
        [1343, 407, 68, 92, 0, 37, 71],
        [1411, 407, 66, 92, 0, 36, 72],
        [385, 313, 63, 93, 0, 34, 73],
        [1901, 119, 62, 94, 0, 34, 74],
        [206, 219, 61, 94, 0, 34, 75],
        [1687, 219, 61, 94, 0, 34, 75],
        [1450, 119, 60, 95, 0, 33, 76],
        [469, 219, 60, 94, 0, 33, 76],
        [705, 219, 61, 94, 0, 34, 75],
        [1044, 219, 63, 94, 0, 35, 74],
        [448, 313, 64, 93, 0, 35, 73],
        [1477, 407, 67, 92, 0, 36, 72],
        [1289, 500, 69, 91, 0, 37, 70],
        [1605, 500, 69, 90, 0, 36, 69],
        [1663, 407, 65, 92, 0, 36, 72],
        [512, 313, 60, 93, 0, 34, 74],
        [1081, 119, 59, 95, 0, 34, 76],
        [1841, 119, 60, 95, 0, 34, 77],
        [529, 119, 60, 96, 0, 34, 77],
        [86, 219, 60, 94, 0, 34, 76],
        [1510, 119, 61, 95, 0, 34, 77],
        [820, 119, 61, 96, 0, 34, 77],
        [943, 119, 62, 95, 0, 34, 77],
        [881, 119, 62, 96, 0, 34, 77],
        [1140, 119, 62, 95, 0, 34, 77],
        [1728, 407, 70, 92, 0, 25, 74],
        [365, 592, 79, 88, 0, 18, 70],
        [1243, 592, 86, 79, 0, 32, 53],
        [1329, 592, 91, 70, 0, 48, 39],
        [1512, 592, 93, 64, 0, 49, 34],
        [1420, 592, 92, 64, 0, 52, 31],
        [1605, 592, 92, 63, 0, 52, 33],
        [1697, 592, 93, 62, 0, 52, 35],
        [1790, 592, 93, 61, 0, 52, 37],
        [0, 680, 93, 60, 0, 52, 39],
        [372, 680, 93, 59, 0, 52, 37],
        [279, 680, 93, 59, 0, 52, 36],
        [93, 680, 93, 59, 0, 52, 35],
        [186, 680, 93, 59, 0, 52, 34],
        [1883, 592, 93, 60, 0, 52, 33]
    ],
    "animations": {
        "move_end": {"frames": [33, 63, 64, 65, 66, 67]},
        "move_start": {"frames": [0, 27, 28, 29, 30, 31, 32]},
        "attack": {"frames": [0, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142]},
        "hit": {"frames": [150, 151, 152, 153, 154, 155]},
        "die_start": {"frames": [0, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200]},
        "move": {"frames": [33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62]},
        "defend_end": {"frames": [156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169]},
        "idle": {"frames": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]},
        "defend_start": {"frames": [0, 143, 144, 145, 146, 147, 148]},
        "die_end": {"frames": [201]},
        "defend_hold": {"frames": [149]}
    },
    "images": ["media/vanguard.png"]
};

},{}],24:[function(require,module,exports){module.exports = {
"images": ["media/common.png"],
"frames": [

    [85, 2, 98, 65], 
    [434, 64, 81, 60], 
    [2, 2, 81, 72], 
    [435, 2, 81, 60], 
    [352, 2, 81, 60], 
    [351, 64, 81, 60], 
    [269, 2, 81, 60], 
    [268, 64, 81, 60], 
    [185, 64, 81, 60], 
    [2, 119, 66, 7], 
    [2, 106, 68, 11], 
    [101, 69, 21, 24], 
    [146, 69, 15, 24], 
    [95, 102, 21, 24], 
    [78, 76, 21, 24], 
    [72, 102, 21, 24], 
    [32, 76, 21, 25], 
    [140, 95, 20, 24], 
    [124, 69, 20, 24], 
    [55, 76, 21, 24], 
    [118, 95, 20, 24], 
    [2, 76, 28, 28], 
    [185, 2, 82, 60]
],
"animations": {
    
        "hex_active":[0], 
        "hex_atkup":[1], 
        "hex_bg":[2], 
        "hex_bg_inset":[3], 
        "hex_defup":[4], 
        "hex_move":[5], 
        "hex_move_select":[6], 
        "hex_target":[7], 
        "hex_target_mark":[8], 
        "hpbar_bar":[9], 
        "hpbar_bg":[10], 
        "n-0":[11], 
        "n-1":[12], 
        "n-2":[13], 
        "n-3":[14], 
        "n-4":[15], 
        "n-5":[16], 
        "n-6":[17], 
        "n-7":[18], 
        "n-8":[19], 
        "n-9":[20], 
        "show-unit-info":[21], 
        "unit-shadow":[22]
},
"texturepacker": [
        "SmartUpdateHash: $TexturePacker:SmartUpdate:23b0ccb5d1e495d22b18f16ef7db7582$",
        "Created with TexturePacker (http://www.texturepacker.com) for EasalJS"
]
}
;
},{}],25:[function(require,module,exports){module.exports = {
"images": ["media/particles.png"],
"frames": [

    [2, 2, 20, 23], 
    [2, 27, 20, 25]
],
"animations": {
    
        "atkup":[0], 
        "defup":[1]
},
"texturepacker": [
        "SmartUpdateHash: $TexturePacker:SmartUpdate:1c1840350e5e1d203ff702617e1dacf7$",
        "Created with TexturePacker (http://www.texturepacker.com) for EasalJS"
]
}
;
},{}],26:[function(require,module,exports){module.exports = {
"images": ["media/foreground.png"],
"frames": [

    [2, 2, 44, 68], 
    [48, 2, 44, 80], 
    [2, 84, 80, 65], 
    [2, 151, 81, 84]
],
"animations": {
    
        "cover0-a":[0], 
        "cover0-b":[1], 
        "spawnpoint":[2], 
        "wall0":[3]
},
"texturepacker": [
        "SmartUpdateHash: $TexturePacker:SmartUpdate:a0e0c08c5f2dc24146a4c451cb86f229$",
        "Created with TexturePacker (http://www.texturepacker.com) for EasalJS"
]
}
;
},{}],28:[function(require,module,exports){(function(){/*global createjs */

var EventEmitter = require('events').EventEmitter;

var UnitSprite = function(entity) {
};

UnitSprite.prototype = new EventEmitter();

UnitSprite.prototype.entity = null;
UnitSprite.prototype.walkDuration = null;
UnitSprite.prototype.container = null;
UnitSprite.prototype.endAnimations = null;
UnitSprite.prototype.lastTile = null;
UnitSprite.prototype.infoButton = null;

UnitSprite.prototype.initialize = function(entity) {
    this.walkDuration = 1000;
    this.container = new createjs.Container();
    this.endAnimations = new EventEmitter();
};

UnitSprite.prototype.face = function(direction, prevent) {
    var scale;
    switch (direction) {
        case 'left':
            scale = -1;
        break;
        case 'right':
            scale = 1;
        break;
        default:
            throw 'unrecognized value `' + direction + '` for parameter direction. Possible values: left|right';
    }
    if (!prevent) {
        this.container.scaleX = scale;
    }
    if (this.infoButton) {
        this.infoButton.scaleX = scale;
    }
    this.direction = scale;
};

UnitSprite.prototype.moveStart = function() {
    this.emit('move:start');
};

UnitSprite.prototype.moveEnd = function() {
    this.emit('move:end');
};

UnitSprite.prototype.move = function(tile) {
    this.lastTile = tile;
    this.emit('move', tile);
};

UnitSprite.prototype.actEnd = function() {
    this.emit('act:end');
};

UnitSprite.prototype.actStart = function() {
    this.emit('act:start');
};

UnitSprite.prototype.act = function() {
    this.emit('act');
};

UnitSprite.prototype.damageStart = function() {
    this.emit('damage:start');
};

/**
 * When the sprite resumes to its normal pose after receving damage
 */
UnitSprite.prototype.damageEnd = function() {
    this.emit('damage:end');
};

/**
 * Event where the sprite receives a damage and performs a hit animation
 */
UnitSprite.prototype.damage = function() {
    this.emit('damage');
};

UnitSprite.prototype.die = function() {
    this.emit('die');
};



module.exports = UnitSprite;

})()
},{"events":2}],31:[function(require,module,exports){module.exports = {
    "animations": {"hit": {"frames": [19, 20, 21, 22, 23, 24, 25]}, "idle": {"frames": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 0]}, "death": {"frames": [26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59]}, "all": {"frames": [59]}},
    "images": ["media/powernode.png"],
    "frames": [
        [1474, 253, 92, 181, 0, 46, 146],
        [674, 474, 92, 179, 0, 46, 144],
        [1058, 474, 92, 178, 0, 46, 143],
        [1826, 474, 92, 177, 0, 46, 142],
        [98, 659, 92, 176, 0, 46, 141],
        [1730, 474, 92, 177, 0, 46, 142],
        [1250, 474, 92, 178, 0, 46, 143],
        [962, 474, 92, 179, 0, 46, 144],
        [578, 474, 92, 180, 0, 46, 145],
        [1954, 253, 92, 181, 0, 46, 146],
        [2, 474, 92, 181, 0, 46, 146],
        [98, 474, 92, 181, 0, 46, 146],
        [1762, 253, 92, 181, 0, 46, 146],
        [1858, 253, 92, 181, 0, 46, 146],
        [482, 474, 92, 181, 0, 46, 146],
        [1666, 253, 92, 181, 0, 46, 146],
        [1570, 253, 92, 181, 0, 46, 146],
        [290, 474, 92, 181, 0, 46, 146],
        [386, 474, 92, 181, 0, 46, 146],
        [194, 474, 92, 181, 0, 46, 146],
        [770, 474, 92, 179, 0, 46, 144],
        [1154, 474, 92, 178, 0, 46, 143],
        [1538, 474, 92, 177, 0, 46, 142],
        [2, 659, 92, 176, 0, 46, 141],
        [1346, 474, 92, 177, 0, 46, 142],
        [1442, 474, 92, 177, 0, 46, 142],
        [290, 659, 92, 173, 0, 46, 138],
        [1634, 474, 92, 177, 0, 46, 142],
        [1922, 474, 92, 176, 0, 46, 141],
        [866, 474, 92, 179, 0, 46, 144],
        [194, 659, 92, 176, 0, 46, 141],
        [1378, 253, 92, 182, 0, 46, 147],
        [1282, 253, 92, 188, 0, 46, 153],
        [1186, 253, 92, 194, 0, 46, 159],
        [886, 253, 92, 200, 0, 46, 165],
        [666, 253, 95, 205, 0, 46, 170],
        [350, 253, 96, 208, 0, 46, 174],
        [245, 253, 101, 212, 0, 47, 179],
        [1892, 2, 113, 218, 0, 52, 182],
        [765, 253, 117, 203, 0, 55, 170],
        [1631, 2, 120, 228, 0, 56, 173],
        [1365, 2, 123, 230, 0, 57, 177],
        [1234, 2, 127, 235, 0, 59, 182],
        [689, 2, 130, 242, 0, 61, 186],
        [554, 2, 131, 242, 0, 61, 189],
        [280, 2, 133, 244, 0, 62, 192],
        [2, 2, 135, 247, 0, 63, 196],
        [141, 2, 135, 246, 0, 63, 196],
        [417, 2, 133, 243, 0, 63, 196],
        [823, 2, 131, 240, 0, 61, 196],
        [958, 2, 133, 239, 0, 62, 196],
        [1095, 2, 135, 236, 0, 63, 196],
        [1492, 2, 135, 230, 0, 63, 194],
        [1755, 2, 133, 219, 0, 63, 188],
        [2, 253, 124, 217, 0, 61, 187],
        [130, 253, 111, 214, 0, 49, 184],
        [450, 253, 108, 207, 0, 48, 176],
        [562, 253, 100, 205, 0, 46, 174],
        [982, 253, 99, 199, 0, 46, 168],
        [1085, 253, 97, 195, 0, 46, 167]
    ]
};
},{}],17:[function(require,module,exports){var Tile = require('./tile');

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
    this.total = 0;
    for(var countY = 0; countY < this.rows; countY++) {
        this.matrix.push([]);
        for(var countX = 0; countX < this.columns; countX++) {
            var tile = new Tile(countX, countY, this.total);
            this.matrix[countY].push(tile);
            this.total++;
        }
    }
};

/**
 * @method get
 * @param {number} x
 * @param {number} y
 * @param {Function} fn
 * @return {Tile}
 */
Tiles.prototype.get = function(x, y, fn) {
    var tile;
    if (this.matrix[y]) {
        tile = this.matrix[y][x];
        if (tile) {
            if (typeof fn === 'function') {
                fn(tile);
            }
        }
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
        if (currentNode.x === end.x && currentNode.y === end.y) {
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
            if (closedList.indexOf(neighbor) > -1 
                || neighbor.wall || neighbor.isOccupied() || currentNode.blocked(neighbor) || neighbor.blocked(currentNode)
               ) {
                   continue;
               }
               scoreG = currentNode.g + 1;
               scoreGBest = false;
               // if it's the first time to touch this tile.
               if(openList.indexOf(neighbor) === -1) {
                   scoreGBest = true;
                   neighbor.h = this.euclidean(neighbor, end);
                   openList.push(neighbor);
               } else if (scoreG < neighbor.g) {
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
 * Finding nearest heuristics
 * @param {object} start
 * @param {object} destination
 * @return {Number}
 */
Tiles.prototype.euclidean = function(start, destination, cost) {
    var vectorX, vectorY;
    if (cost === null) {
        cost = 1;
    }
    vectorX = Math.pow(start.x - destination.x, 2);
    vectorY = Math.pow(start.y - destination.y, 2);
    return Math.sqrt(vectorX + vectorY);
    //vectorX = start.x - destination.x;
    //vectorY = start.y - destination.y;
    //return Math.sqrt(vectorX * vectorX + vectorY * vectorY) * cost;
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

},{"./tile":10}],19:[function(require,module,exports){var Stat = require('./stat');

var Stats = function() {
    this.initialize.apply(this, arguments);
};

/**
 * @type {Array}
 * @private
 */
Stats.prototype.list = null;

/**
 * @type {object}
 * @private
 */
Stats.prototype._dictionary = null;

/**
 * @method initialize
 * @protected
 * @param {object} stats
 */
Stats.prototype.initialize = function(stats) {
    this.list = [];
    this._dictionary = {};
    this.set(stats);
    this.add('null', 0);
};

/**
 * Add an attribute
 * @method add
 * @param {Stat|Object} data
 * @param {String} data2
 */
Stats.prototype.add = function(name, val, max) {
    var stat = new Stat(name, val, max);
    this.list.push(stat);
    this._dictionary[stat.name] = stat;
};

/**
 * Override existing stat data.
 * @method set
 * @param {object} stats
 */
Stats.prototype.set = function (stats) {
    var stat;
    var value;
    for (var key in stats) {
        if (stats.hasOwnProperty(key)) {
            value = stats[key];
            if (value.max) {
                value = value.max;
            }
            if ((stat = this.get(key))) {
                stat.setBase(value);
            } else {
                this.add(new Stat(key, value));
            }
        }
    }
};

/**
 * Returns a re-parsed json equivalent.
 * @method toJSON
 * @return {Object}
 */
Stats.prototype.json = function() {
    var attr = {};
    for(var i=0; i<this.list.length;i++) {
        var stat = this.list[i];
        if (stat.name === 'null') {
            continue;
        }
        attr[stat.name] = {
            value: stat.value,
            max: stat.max
        };
    }
    return attr;
};

/**
 * returns a Stat Object
 * @method get
 * @param name
 * @return {Stat}
 */
Stats.prototype.get = function(name) {
    var stat = this._dictionary[name];
    if (!stat) {
        stat = this.get('null');
    }
    return stat;
};

Stats.prototype.each = function(fn) {
    var stat;
    for (var i=0; i < this.list.length; i++) {
        stat = this.list[i];
        if (stat.name === 'null') {
            continue;
        }
        if (fn(stat, i) === false) {
            break;
        }
    };
};

module.exports = Stats;

},{"./stat":32}],20:[function(require,module,exports){var Command = require('./command');
var Collection = require('../collection');

var Commands = function() {
    this.initialize.apply(this, arguments);
};

Commands.prototype = new Collection();
Commands.prototype.__super = Collection.prototype;

Commands.prototype.initialize = function(data) {
    this.set.apply(this, arguments);
    this.__super.initialize.apply(this);
};

Commands.prototype.get = function(id, fn) {
    var command = this.__super.get.apply(this, arguments);
    if (typeof fn === 'function') {
        if (command) {
            fn(command);
        }
    }
    return command;
};

Commands.prototype.set = function(data) {
    if (typeof data === 'object') {
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                this.add(key, data[key]);
            }
        }
    }

};

Commands.prototype.add = function(name, options) {
    var command = new Command(name, options);
    this.__super.add.call(this, command);
};

module.exports = Commands;

},{"./command":33,"../collection":34}],32:[function(require,module,exports){var Stat = function() {
	this.initialize.apply(this, arguments);
};

/**
 * @type string
 */
Stat.prototype.name = null;

/**
 * @type number
 */
Stat.prototype.value = null;

/**
 * @type number
 */
Stat.prototype.max = null;

/**
 * @method initialize
 * @protected
 * @param {string} name
 * @param {number} value
 */
Stat.prototype.initialize = function(name, value, max) {
	this.name = name;
	this.value = typeof value === 'number' ? value : 0;
	this.max = typeof max === 'number' ? max : this.value;
};

/**
 * Sets the value and the maximum value.
 * @method setBase
 * @param {number} val
 */
Stat.prototype.setBase = function(val) {
	this.value = this.max = val;
};

/**
 * Sets the maximum value
 * @method setMax
 * @param {number} val
 */
Stat.prototype.setMax = function(val) {
	this.max = val;
};


/**
 * Sets the value
 * @method setValue
 * @param {number} val
 * @return {number}
 */
Stat.prototype.setValue = function(val) {
	return this.value = Math.max(Math.min(val, this.max), 0);
};

/**
 * Reduces the value to 0
 * @method empty
 */
Stat.prototype.empty = function() {
	this.value = 0;
};

/**
 * Reduce the value by the value of the argument
 * @param {number} val
 */
Stat.prototype.reduce = function(val) {
	if (val === null || val === undefined) {
		val = 1;
	}
	this.setValue(this.value - val);
};

/**
 * Add value
 * @method increase
 * @param [val=1]
 */
Stat.prototype.increase = function(val) {
	if (typeof val !== 'number') {
		val = 1;
	}
	this.setValue(this.value + val);
};

/**
 * Resets the stat value to its maximum value
 * @method reset
 * @param val
 */
Stat.prototype.reset = function(val) {
	this.value = this.max;
};

/**
 * Gets the ratio of the value from the max value.
 * @method ratio
 * @return {Number}
 */
Stat.prototype.ratio = function() {
	return this.value / this.max;
};

Stat.prototype.val = function() {
	return this.value;
};

module.exports = Stat;

},{}],33:[function(require,module,exports){var Command = function() {
    this.initialize.apply(this, arguments);
};

/**
 * Identifier for the command
 * @type {String}
 */
Command.prototype.id = null;

/**
 * Base value for the damage
 * @type {Number}
 */
Command.prototype.damage = null;

/**
 * How far the command can range
 * @type {Number}
 */
Command.prototype.range = null;

/**
 * The range of the command's affected area
 * @type {Number}
 */
Command.prototype.splash = null;

/**
 * @param {String} id
 * @param {Number} damage
 * @param {Number} range
 * @param {Object} [options]
 */
Command.prototype.initialize = function(id, options) {
    if (id === null) {
        throw new Error('command id is required');
    }
    this.id = id;
    this.cooldown = 0;
    this.damage = 0;
    this.range = 0;
    this.splash = 0;
    this.cost = 1;
    if (typeof options === 'object') {
        for(var key in options) {
            if (options.hasOwnProperty(key)) {
                this[key] = options[key];
            }
        }
    }
};

Command.prototype.set = function(data) {
    for(var key in data) {
        if (data.hasOwnProperty(key)) {
            this[key] = data[key];
        }
    }
};

Command.create = function(data, callback) {
    var command = new Command();
    command.set(data);
    callback(null, command);
};

module.exports = Command;

},{}],34:[function(require,module,exports){var Collection = function() {
    this.initialize();
};

Collection.prototype.initialize = function() {
    this._dictionary = {};
    this.children = [];
};

Collection.prototype.add = function(object) {
    if (!object || !object.id) {
        throw new Error('id is required');
    }
    this._dictionary[object.id] = object;
    this.children.push(object);
};

Collection.prototype.get = function(id, fn) {
    return this._dictionary[id];
};

Collection.prototype.at = function(index) {
    return this.children[index];
};

Collection.prototype.first = function() {
    return this.children[0];
};

Collection.prototype.remove = function(child) {
    this.children.splice(this.children.indexOf(child), 1);
    delete this._dictionary[child.id];
};

Collection.prototype.each = function(fn) {
    var child;
    for (var i=0; i < this.children.length; i++) {
        child = this.children[i];
        if (child.name === 'null') {
            continue;
        }
        if (fn(child, i) === false) {
            break;
        }
    };
};


module.exports = Collection;

},{}],35:[function(require,module,exports){/**
 * @author James Florentino
 */

/** globals **/
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');

/** game **/
var Game = require('./game/game');

/** client **/
var Client = require('./client/client');
var assetManifest = require('./client/asset-manifest.js');
var settings = require('./client/settings');
var UIKeyBindings = require('./client/ui-keybindings');
var serverEmulator = require('./routes/game-server');
var clientEvents = require('./routes/client-routes');
var gameRoutes = require('./routes/game-routes');
var socket = window.socket || new EventEmitter();

/** level **/
var baseLevel = require('./levels/base');


function preventDraggingiOS() {
    document.body.addEventListener('touchmove', function (ev) { 
        ev.preventDefault();
    }); 
    window.addEventListener("load",function() {
            // Set a timeout...
        setTimeout(function(){
            // Hide the address bar!
            window.scrollTo(0, 1);
        }, 0);
    });
}

function preventContextMenu() {
    document.querySelector('canvas').addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
}


preventDraggingiOS();
preventContextMenu();
window.addEventListener('load', function() {
    Game.create(function(err, game) {
        game.loadMap(baseLevel);
        Client.create(game, function(err, client) {
            //client.debug = true;
            client.preloader.load(assetManifest, function(err) {
                client.setScene(document.querySelector('canvas#game'), function(err) {
                    clientEvents(game, client, socket);
                    gameRoutes(socket, game);
                    UIKeyBindings(game, client);
                    if (!window.socket) {
                        serverEmulator(socket, baseLevel);
                    }
                });

            });

        });

    });
});

},{"events":2,"./client/asset-manifest.js":3,"./game/game":36,"./client/client":37,"./client/settings":4,"./client/ui-keybindings":38,"./routes/game-server":39,"./routes/client-routes":6,"./routes/game-routes":8,"./levels/base":5,"underscore":40}],40:[function(require,module,exports){(function(){//     Underscore.js 1.4.4
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      concat           = ArrayProto.concat,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.4.4';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? null : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See: https://bugs.webkit.org/show_bug.cgi?id=80797
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value || _.identity);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    each(input, function(value) {
      if (_.isArray(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(concat.apply(ArrayProto, arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(args, "" + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(context, args.concat(slice.call(arguments)));
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent, but `Object`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                               _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
        return false;
      }
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(n);
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

})()
},{}],36:[function(require,module,exports){var HexTiles = require('./tiles/hextiles');
var EventEmitter = require('events').EventEmitter;
var GameEntity = require('./entity');
var Tile = require('./tiles/tile');
var _ = require('underscore');

var Game = function() {
    this.initialize.apply(this, arguments);
};

Game.rows = 8;
Game.columns = 10;

Game.prototype = new EventEmitter();

Game.prototype.initialize = function() {
    this.entities = [];
    this._entitiesDict = {};
    this.tiles = new HexTiles(Game.columns, Game.rows);
};

Game.prototype.addEntity = function(entity) {
    if (entity instanceof GameEntity) {
        if (entity.id) {
            this._entitiesDict[entity.id] = entity;
            this.entities.push(entity);
            this.emit('unit:add', entity);
        } else {
            throw(new Error('GameEntity requires an ID'));
        }
    } else {
        throw(new Error('Not a valid GameEntity'));
    }
};

Game.prototype.removeEntity = function(entity) {
    var tile = entity.tile;
    tile.vacate(entity);
    delete this._entitiesDict[entity.id];
    this.entities.splice(this.entities.indexOf(entity), 1);
    this.emit('unit:remove', entity);
    entity.die();
};

Game.prototype.createEntity = function(options, callback) {
    var entity = GameEntity.create(options.id);
    if (entity) {
        if (options) {
            entity.type = options.type;
            entity.set(options.attributes);
        }
        if (typeof callback === 'function') {
            callback(entity);
        }
    }
    return entity;
};

Game.prototype.spawnEntity = function(options, fn) {
    var _this = this;
    this.createEntity(options, function(entity) {
        _this.tiles.get(options.x, options.y, function(tile) {
            entity.move(tile);
            _this.addEntity(entity);
            if (typeof fn === 'function') {
                fn(entity);
            }
        });
    });
};

Game.prototype.moveEntity = function(entity, tile, sync) {
    entity.move(tile, sync);
    this.emit('unit:move', entity, sync);
};

Game.prototype.getEntity = function(id, callback) {
    var entity = this._entitiesDict[id];

    if (typeof callback === 'function') {
        if (entity) {
            callback(entity);
        }
    }
    return entity;
};

Game.prototype.eachEntity = function(callback) {
    _.each(this.entities, callback);
};

Game.prototype.loadMap = function(tiles) {
    var _this = this;
    _.each(tiles, function(t) {
        _this.tiles.get(t.x, t.y, function(tile) {
            for(var key in t) {
                if (t.hasOwnProperty(key)) {
                    tile[key] = t[key];
                }
            }
        });
    });
};


Game.prototype.actEntity = function(entity, tile, command, target) {
    var _this = this;
    var attackRange = command.range;
    var splashRange = command.splash;
    var targets = [];
    var results = [];
    var tiles;
    var p = tile;

    // get the affected units
    tiles = this.tiles.neighbors(tile, splashRange);
    tiles = [tile].concat(tiles);
    tiles = _.filter(tiles, function(tile) {
        return tile.entities.length > 0 && !tile.has(entity);
    });

    _.each(tiles, function(tile, i) { // Subsequent damage chains of the tiles shouldn't be as high as the targetted unit
        var target, result;
        target = tile.entities[0];
        if (target.stats.get('health').val() > 0) {
            result = entity.act(target, command, i);
            target.damage(result.damage);
            targets.push({
                id: target.id,
                damage: result.damage
            });
            if (result.status) {
                results.push({
                    id: target.id,
                    status: result.status
                });
            }
        }

    });

    this.emit('unit:act', {
        id: entity.id,
        x: tile.x,
        y: tile.y,
        type: command.id,
        targets: targets,
        results: results
    });
};

/** Turn based component **/
Game.prototype.setTurn = function(entity) {
    if (this.entities.indexOf(entity) > -1) {
        this.currentTurn = entity;
        entity.stats.get('actions').reset();
        entity.enable();
        this.emit('unit:enable', entity);
    }
};

Game.prototype.endTurn = function() {
    var entity = this.currentTurn;
    if (entity) {
        entity.disable();
        entity.stats.get('turn').empty();
        this.emit('unit:disable', entity);
    }
    this.currentTurn = null;
};

Game.prototype.nextTurn = function() {
    var _this = this;
    var interval;
    var calculate = function() {
        var entity, turn, turnspeed, i, l;
        console.log('calculating');
        for (i = 0, l = _this.entities.length; i < l; i++){
            entity = _this.entities[i];
            if (entity.stats.get('health').val() === 0) {
                continue;
            }
            turn = entity.stats.get('turn');
            turn.increase(entity.stats.get('turnspeed').val());
            if (turn.val() == turn.max) {
                _this.setTurn(entity);
                clearInterval(interval);
                break;
            }
        };
    };
    this.endTurn();
    interval = setInterval(calculate, 10);
};

Game.prototype.getTurnID = function(fn) {
    if (typeof fn === 'function') {
        fn(this.currentTurn);
    }
    return this.currentTurn;
};

Game.prototype.checkCurrentTurn = function() {
    if (this.currentTurn.stats.get('actions').val() === 0){
        this.endTurn();
        this.nextTurn();
    }
};

Game.create = function(callback) {
    var game = new Game();
    if (typeof callback === 'function') {
        callback(null, game);
    }
    return game;
};


module.exports = Game;

},{"events":2,"./tiles/hextiles":16,"./entity":18,"./tiles/tile":10,"underscore":40}],38:[function(require,module,exports){var _ = require('underscore');
var keymanager = require('./keymanager');

_.templateSettings = {
  interpolate : /\{\{(.+?)\}\}/g
};


module.exports = function UIKeyBindings(game, client) {
    var tplUnitInfo = _.template(document.querySelector('#tpl-unit-info').innerHTML);
    var domUnitInfo = document.querySelector('#unit-info');
    var domUIContainer = document.querySelector('#ui-container');
    var domHelpButton = document.querySelector('#help-button');

    function showUnitInfo(entity) {
        if (!entity) {
            return;
        }
        game.getEntity(entity.id, function(entity) {
            var health = entity.stats.get('health');
            var range = entity.stats.get('range');
            var reach = entity.commands.at(0);
            domUnitInfo.innerHTML = tplUnitInfo({
                name: entity.data.name,
                role: entity.data.role,
                description: entity.data.description,
                health: health.ratio(),
                health_val: health.val(),
                health_max: health.max,
                def: entity.stats.get('defense').val(),
                atk: entity.commands.at(0).damage
            });
            _.each(
                domUnitInfo.querySelectorAll('.range-stat .range-bg'),
                function(rangeBG, i) {
                    if (i + 1> range.val()) {
                        rangeBG.innerHTML = '';
                    }
                }
            );

            _.each(
                domUnitInfo.querySelectorAll('.reach-stat .reach-bg'),
                function(reachBG, i) {
                    if (i > reach.range - 1) {
                        reachBG.innerHTML = '';
                    }
                }
            );
            domUnitInfo.classList.remove('hidden');
        });
    }

    function hideUnitInfo() {
        domUnitInfo.classList.add('hidden');
        client.hideUnitOptions();
    }

    function toggleUnitInfo(e) {
        if (domUnitInfo.classList.contains('hidden')) {
            showUnitInfo();
        } else {
            hideUnitInfo();
        }
    }

    var showingUnitOptions = false;
    function showUnitOptions() {
        if (showingUnitOptions) {
            hideUnitInfo();
            showingUnitOptions = false;
        } else {
            client.showUnitOptions();
            showingUnitOptions = true;
        }
    }

    domHelpButton.addEventListener('mousedown', showUnitOptions);
    domUnitInfo.addEventListener('mousedown', showUnitOptions);
    client.on('input:unit:info', showUnitInfo);
    //domHelpButton.addEventListener('touchend', toggleUnitInfo);
};

},{"./keymanager":15,"underscore":40}],37:[function(require,module,exports){(function(){/*global createjs */
var Preloader = require('./Preloader');
var HexUtil = require('./hexutil');
var frames = require('./frames/frames'); // spriteSheet frameData
var Game = require('../game/game');
var settings = require('./settings');
var EventEmitter = require('events').EventEmitter;
var spriteClasses = {
    marine: require('./unit-classes/marine'),
    vanguard: require('./unit-classes/vanguard'),
    powernode: require('./unit-classes/powernode')
};
var frameDataOffset = require('./frame-data-offset');
var _ = require('underscore');
var Ease = createjs.Ease;
var Tween = createjs.Tween;
var wait = require('../game/wait');

var Client = function(game) {
    this.initialize.apply(this, arguments);
};

Client.prototype = new EventEmitter();

Client.prototype.initialize = function(game) {
    var _this = this;
    var turnRoutes = new EventEmitter();

    this.game = game;
    this.units = {};
    this._unitList = [];
    this.preloader = new Preloader();

    turnRoutes.on('result:death', function(unit) {
        unit.die();
    });

    turnRoutes.on('result:damage', function(unit) {
        unit.damageEnd();
    });

    this.game.on('unit:add', function(entity) {
        _this.createUnit(entity);
    });

    this.game.on('unit:act', function(data) {
        _this.getUnit(data.id, function(unit) {
            var parent = unit;
            var targets = [];
            var tileSprites = [];
            /** Tell the active unit to which direction to face **/
            _this.getUnit(data.targets[0].id, function(unit) {
                parent.face(unit.container.x > parent.container.x ? 'right' : 'left');
            });
            _.each(data.targets, function(target) {
                _this.getUnit(target.id, function(unit) {
                    unit.face(unit.container.x < parent.container.x ? 'right' : 'left');
                });
            });
            // Make sure they're all clean
            unit.removeAllListeners('act:end');
            unit.removeAllListeners('act');

            unit.on('act:end', function() {
                unit.removeAllListeners('act:end');
                unit.removeAllListeners('act');
                _.each(targets, function(target) {
                    var unit = target.unit;
                    var damage = target.damage;
                    _this.showDamage(unit, damage);
                });

                _.each(data.results, function(result) {
                    _this.getUnit(result.id, function(unit) {
                        turnRoutes.emit('result:' + result.status, unit);
                    });
                });

                _.each(tileSprites, function(tileSprite) {
                    tileSprite.parent.removeChild(tileSprite);
                });
            });

            unit.on('act', function() {
                _.each(targets, function(target, i) {
                    var unit = target.unit;
                    var coord = HexUtil.coord(target.entity.tile, true);
                    var posX = coord.x + (unit.container.x > parent.container.x ? 10 : -10);
                    var direction = unit.direction;
                    Tween.get(unit.container)
                    .wait(i * 50)
                    .call(function() {
                        unit.damage();
                    })
                    .to({
                        scaleX: 1.15 * direction,
                        scaleY: 1.15,
                        x: posX
                    }).to({
                        scaleX: direction,
                        scaleY: 1,
                        x: coord.x
                    }, 300, Ease.backOut)
                    ;
                });
            });

            _.each(data.targets, function(obj) {
                var id = obj.id;
                var damage = obj.damage;
                _this.game.getEntity(id, function(entity) {
                    _this.getUnit(id, function(unit) {
                        _this.createTile('hex_target', entity.tile, function(tileSprite) {
                            targets.push({
                                unit: unit,
                                entity: entity,
                                damage: damage
                            });
                            tileSprites.push(tileSprite);
                            unit.damageStart();
                        });
                    });
                });
            });


            unit.actStart();
        });
    });
};

Client.prototype.setScene = function(canvas, callback) {
    var _this = this;
    this.layers = {};
    this.stage = new createjs.Stage(canvas);
    this.width = canvas.width;
    this.height = canvas.height;
    createjs.Touch.enable(this.stage);
    _this.resource('background', function(err, backgroundImage){ 
        _this.setSpriteSheets(function() {
            _this.setBackground(backgroundImage, function() {
                _this.initializeLayers(function() {
                    _this.setTiles(_this.game.tiles, function() {
                        _this.game.on('tiles:config', function() {
                            _this.setTiles(_this.game.tiles);
                        });
                        _this.setTimers(function() {
                            callback();
                        });
                    });
                });
            });
        });
    });
};

Client.prototype.setSpriteSheets = function(callback) {
    this.spriteSheets = {};
    for(var key in frames) {
        if (frames.hasOwnProperty(key)) {
            this.spriteSheets[key] = new createjs.SpriteSheet(frames[key]);
        }
    }
    callback(null, this.spriteSheets);
};

Client.prototype.applySpriteOffset = function(sprite, name) {
    var key;
    var offset = frameDataOffset[name];
    if (offset) {
        for(key in offset) {
            if (offset.hasOwnProperty(key)) {
                sprite[key] = offset[key];
            }
        }
    }
};

Client.prototype.createFGElement = function(name, tile, callback) {
    var animation, spriteSheet, coord, regX, regY, offsetDepth, _this = this;
    spriteSheet = this.spriteSheets.foreground;
    offsetDepth = typeof tile.offsetdepth === 'number' ? tile.offsetdepth : 0;
    if (spriteSheet.getAnimation(name)) {
        animation = new createjs.BitmapAnimation(spriteSheet);
        animation.gotoAndStop(name);
        coord = HexUtil.coord(tile);
        this.applySpriteOffset(animation, tile.type);
        animation.set({
            x: coord.x,
            y: coord.y
        });
        _this.setSpriteDepth(animation, tile.z + offsetDepth);
        if (typeof callback === 'function') {
            callback(animation);
        }
    }
    return animation;
};

Client.prototype.createSprite = function(name, callback) {
    var animation = new createjs.BitmapAnimation(this.spriteSheets.common);
    animation.gotoAndStop(name);
    this.applySpriteOffset(animation, name);
    if (typeof callback === 'function') {
        callback(null, animation);
    }
    return animation;
};

Client.prototype.createParticle = function(name, fn) {
    var animation = new createjs.BitmapAnimation(this.spriteSheets.particles);
    animation.gotoAndStop(name);
    fn(animation);
    return animation;
};

Client.prototype.setSpriteDepth = function(sprite, zIndex) {
    var i, _len, container, child;
    container = this.layers.units;
    sprite.z = zIndex;
    container.removeChild(sprite);
    for(i = 0, _len = container.children.length; i < _len; i++) {
        child = container.children[i];
        if (child.z >= sprite.z) {
            break;
        }
    }
    container.addChildAt(sprite, i);
};

Client.prototype.createUnit = function(entity, callback) {
    var unit, UnitSpriteClass, _this = this;
    UnitSpriteClass = spriteClasses[entity.type];
    if (UnitSpriteClass) {
        unit = new UnitSpriteClass(entity);
        unit.id = entity.id;
        unit.infoButton = this.createSprite('show-unit-info');
        unit.infoButton.addEventListener('click', function() {
            _this.showUnitInfo(entity);
            Tween.get(unit.infoButton)
                .to({ scaleY: 1.5 }, 200, Ease.quartIn)
                .to({ scaleY: 1 }, 300, Ease.quartOut)
                ;
        });
        unit.infoButton.visible = false;
        unit.container.addChild(unit.infoButton);
        _this.addUnit(entity.id, unit, function() {
            _this.unitEvents(unit, entity);
            _this.spawnUnit(unit, entity.tile);
            if (typeof callback === 'function') {
                callback(unit);
            }
        });
    }
};

Client.prototype.unitEvents = function(unit, entity) {
    var game = this.game,
    _this = this;

    entity.on('die', function() {
        _this.removeUnit(unit);
    });

    entity.on('enable', function() {
        _this.createSprite('hex_active', function(err, sprite) {
            sprite.name = 'indicator';
            sprite.set({
                regX: HexUtil.WIDTH * 0.5 + 6,
                regY: HexUtil.HEIGHT * 0.5,
                scaleX: 0,
                scaleY: 0,
                alpha: 0
            });
            Tween.get(sprite)
                .to({
                    scaleX: 1,
                    scaleY: 1,
                    alpha: 1
                }, 450, Ease.backInOut);
            sprite.addEventListener('mousedown', function() {
                unit.emit('tile:select');
            });
            unit.container.addChildAt(sprite, 0);
        });
    });

    entity.on('disable', function() {
        var sprite = unit.container.getChildByName('indicator');
        Tween.removeTweens(sprite);
        if (sprite) {
            sprite.parent.removeChild(sprite);
        }
    });

    entity.on('move:start', function moveStart(tile) {
        var tween;
        var path;
        var prevTile = unit.lastTile;
        path = game.tiles.findPath(prevTile, tile);
        unit.prevX = HexUtil.coord(prevTile).x;
        unit.moveStart();
        Tween.removeTweens(unit.container);
        Tween.get(unit.container.getChildByName('indicator')).to({ alpha: 0, scaleX: 0, scaleY: 0 }, 100);

        if (unit.tilePathObject) {
            _this.layers.tiles.removeChild.apply(_this.layers.tiles, unit.tilePathObject.tileSprites);
            _this.layers.tiles.removeChild(unit.tilePathObject.linePath);
        }

        if (unit.particles) {
            _.each(unit.particles, function(particle) {
                Tween.get(particle)
                .to({
                    y: particle.y + 40,
                    alpha: 0
                }, 800, Ease.backIn)
                .call(function() {
                    particle.parent.removeChild(particle);
                });
            });
            unit.particles = [];
        }

        tween = Tween.get(unit.container);
        unit.tilePathObject = _this.generateTilePath(
            [prevTile].concat(path),
            function(tileSprite, i, prevTileSprite, tile) {
                if (i) { // Skip the 1st tile since it's the current
                    var walkDuration =
                        tileSprite.y !== (prevTileSprite ? prevTileSprite.y : tileSprite.y) ?
                        unit.walkDuration * 0.75 :
                        unit.walkDuration;
                    tween = tween
                        .call(function() { // tell which direction to face
                            if (tileSprite.x > unit.prevX) {
                                unit.face('right');
                            } else {
                                unit.face('left');
                            }
                            unit.prevX = tileSprite.x;
                            unit.prevY = tileSprite.y;
                            unit.currentTileZ = tile.z;
                            unit.move(tile);
                        })
                        .to({
                            x: tileSprite.x,
                            y: tileSprite.y
                        }, walkDuration);
                }
            }
        );
        tween.call(function() {
            var linePath = unit.tilePathObject.linePath;
            var tileSprites = unit.tilePathObject.tileSprites;
            _.each(tileSprites, function(tileSprite, i) {
                Tween.get(tileSprite).wait(i * 100)
                .to({
                    scaleX: 0,
                    scaleY: 0
                }, 250, Ease.backIn)
                .call(function() {
                    if (tileSprite.parent) {
                        tileSprite.parent.removeChild(tileSprite);
                    }
                });
            });
            Tween
                .get(linePath)
                .wait(105 * tileSprites.length)
                .to({
                    alpha: 0
                }, 150)
                .call(function() {
                    if (linePath.parent) {
                        linePath.parent.removeChild(linePath);
                    }
                });
            unit.moveEnd();
        });
    });

    entity.on('move:update', function(tile) {
        var coord = HexUtil.coord(tile, true);
        Tween.removeTweens(unit.container);
        if (unit.tilePathObject) {
            _this.layers.tiles.removeChild.apply(_this.layers.tiles, unit.tilePathObject.tileSprites);
            _this.layers.tiles.removeChild(unit.tilePathObject.linePath);
        }
        unit.prevX = HexUtil.coord(unit.lastTile).x;
        unit.container.x = coord.x;
        unit.container.y = coord.y;
        unit.move(tile);
    });

    unit.on('move', function sortUnits(tile) {
        _this.setSpriteDepth(unit.container, unit.currentTileZ || tile.z);
    });

    unit.on('move:end', function() {
        var indicator = unit.container.getChildByName('indicator');
        if (indicator) {
            Tween.get(indicator).to({ alpha: 1, scaleX: 1, scaleY: 1 }, 600, Ease.quintInOut);
        }
        _this.showTileBonus(entity.tile, function(particle) {
            unit.particles = [particle];
        });
    });

    unit.on('tile:select', function inputSelect() {
        if (_this.game.currentTurn === entity) {
            unit.emit('tile:select:move');
            unit.emit('tile:select:act');
        }
    });

    unit.on('tile:select:move', function() {
        var moveTiles;
        if (unit.tileSprites) {
            unit.emit('tiles:hide:path');
            unit.emit('tiles:hide:move');
        } else {
            unit.tileSprites = [];
            movable = game.tiles.findRange(entity.tile, entity.stats.get('range').value);
            moveTiles = _.filter(movable, function(tile) {
                return tile.entities.length === 0 && !tile.wall && tile !== entity.tile;
            });

            // show moveable tiles
            _this.createTiles('hex_move', moveTiles, function(err, tileSprite, tile, i) {
                tileSprite.addEventListener('mousedown', function() {
                    var tiles, pathSpriteObject, lastTile;
                    var path = game.tiles.findPath(entity.tile, tile);
                    tiles = [entity.tile].concat(path);
                    unit.emit('tiles:hide:target');
                    unit.emit('tiles:hide:path');
                    pathSpriteObject = _this.generateTilePath(tiles);
                    lastTile = pathSpriteObject.tileSprites[pathSpriteObject.tileSprites.length - 1];
                    lastTile.addEventListener('mousedown', function() {
                        wait(100, function() {
                            _this.emit('input:move', {
                                tile: tile,
                                entity: entity
                            });
                        });
                        unit.emit('tiles:hide:all');
                    });
                    unit.tileSpritePaths = [].concat(pathSpriteObject.tileSprites).concat(pathSpriteObject.linePath);
                });
                unit.tileSprites.push(tileSprite);
                tileSprite.set({
                    scaleX: 0,
                    scaleY: 0,
                    alpha: 0
                });
                Tween.get(tileSprite)
                    .wait(i * 10)
                    .to({
                        scaleX: 1,
                        scaleY: 1,
                        alpha: 1
                    }, 200, Ease.backOut);
            });
        }
    });

    unit.on('tile:select:act', function(command) {
        var targets;
        var entityTile = entity.tile;
        if (command || (command = entity.commands.first())) {
            if (unit.tileSpritesTarget) {
                unit.emit('tiles:hide:act');
                unit.emit('tiles:hide:target');
            } else {
                unit.tileSpritesTarget = [];
                targets = game.tiles.neighbors(entity.tile, command.range);
                targets = _.filter(targets, function(tile) {
                    var truthy = tile.entities.length > 0;
                    _.each(tile.entities, function(entity) {
                        if (entity.stats.get('health').val() === 0) {
                            truthy = false;
                        }
                        return truthy;
                    });
                    return truthy;
                });

                (function sortLineOfSight() {
                    var tile, start, end, h, slope;
                    var _dict = {};
                    var list = [];
                    for(var i=0, total=targets.length; i < total; i++) {
                        tile = targets[i];
                        start = HexUtil.coord(entity.tile);
                        end = HexUtil.coord(tile);
                        // Pythagorean theorem for distance calculation
                        // used for determining line of sight.
                        tile.distance = Math.sqrt(
                            Math.pow(end.x - start.x,2) +
                            Math.pow(end.y - start.y,2)
                        );
                        // use to determine the angle of the unit.
                        slope = (end.y - start.y) / (end.x - start.x);
                        if (!_dict[slope]) {
                            _dict[slope] = tile;
                            list.push(_dict[slope]);
                        } else {
                            if ([_dict].distance > tile.distance )  {
                                _dict[slope] = tile;
                            }
                        }
                    }
                    targets = list;
                }).call();

                _this.createTiles('hex_target', targets, function(err, tileSprite, tile, i) {
                    var targetUnit;
                    var targetEntity;
                    targetEntity = tile.entities[0];
                    if (targetEntity) {
                        targetUnit = _this.getUnit(targetEntity.id);
                        if (targetUnit) {
                            targetUnit.container.addChildAt(tileSprite, 0);
                        }
                    }
                    unit.tileSpritesTarget.push(tileSprite);
                    tileSprite.addEventListener('mousedown', function() {
                        var tiles, tileSprites;
                        tiles = [tile];
                        tileSprites = [];

                        unit.emit('tiles:hide:path');
                        unit.emit('tiles:hide:target');
                        unit.tileSpritesTargetMark = [];

                        _this.createTiles('hex_target_mark', tiles, function(err, tileSprite, tile, i) {
                            targetUnit.container.addChildAt(tileSprite, 1);
                            tileSprites.push(tileSprite);
                            tileSprite.addEventListener('mousedown', function() { 
                                /** delay to give some breathing space to the UI **/
                                wait(100, function() {
                                    _this.emit('input:act', {
                                        tile: tile,
                                        entity: entity,
                                        target: targetEntity,
                                        command: command
                                    });
                                });
                                unit.emit('tiles:hide:all');
                            });
                            tileSprite.set({
                                x: 0,
                                y: 0,
                                scaleX: 0,
                                scaleY: 0,
                                alpha: 0
                            });
                            Tween.get(tileSprite)
                            .wait(i * 10)
                            .to({
                                scaleX: 1,
                                scaleY: 1,
                                alpha: 1
                            }, 200, Ease.backOut);

                            var splashTiles = game.tiles.neighbors(tile, command.splash);
                            splashTiles = _.filter(splashTiles, function(tile) {
                                var entities = tile.entities;
                                return entities.length && entities[0] !== entity && !entities[0].isDead();
                            });
                            var targetTile = tile;
                            _this.createTiles('hex_target', splashTiles, function(err, tileSprite, tile) {
                                unit.tileSpritesTargetMark.push(tileSprite);
                                var linePath = _this.createAttackLinePath(targetTile, tile);
                                unit.tileSpritesTargetMark.push(linePath);
                            });
                        });

                        var linePath = _this.createAttackLinePath(entity.tile, tile);
                        unit.tileSpritesTargetMark.push(linePath);
                        unit.tileSpritesTargetMark = unit.tileSpritesTargetMark.concat(tileSprites);
                    });
                    tileSprite.set({
                        x: 0,
                        y: 0,
                        scaleX: 0,
                        scaleY: 0,
                        alpha: 0
                    });
                    Tween.get(tileSprite)
                    .wait(i * 10)
                    .to({
                        scaleX: 1,
                        scaleY: 1,
                        alpha: 1
                    }, 200, Ease.backOut);
                });
            }
        }
    });

    unit.on('tiles:hide:all', function() {
        unit.emit('tiles:hide:path');
        unit.emit('tiles:hide:move');
        unit.emit('tiles:hide:act');
        unit.emit('tiles:hide:target');
    });

    unit.on('tiles:hide:act', function() {
        var tiles = unit.tileSpritesTarget;
        if (tiles) {
            _.each(tiles, function(sprite) {
                sprite.parent.removeChild(sprite);
            });
            delete unit.tileSpritesTarget;
        }
    });

    unit.on('tiles:hide:target', function() {
        var tiles = unit.tileSpritesTargetMark;
        if (tiles) {
            _.each(tiles, function(sprite) {
                sprite.parent.removeChild(sprite);
            });
            delete unit.tileSpritesTargetMark;
        }
    });

    unit.on('tiles:hide:path', function() {
        var tiles = unit.tileSpritePaths;
        if (tiles) {
            _this.layers.tiles.removeChild.apply(_this.layers.tiles, tiles);
            delete unit.tileSpritePaths;
        }
    });

    unit.on('tiles:hide:move', function() {
        if (unit.tileSprites) {
            _this.layers.tiles.removeChild.apply(_this.layers.tiles, unit.tileSprites);
            delete unit.tileSprites;
        }
    });
};

Client.prototype.showTileBonus = function(tile, fn) {
    var _this = this;
    var name;
    if (_.has(tile, 'attack')) {
        name = 'atkup';
    } else if (_.has(tile, 'defense')) {
        name = 'defup';
    }
    if (name) {
        _this.createParticle(name, function(particle) {
            var coord = HexUtil.coord(tile, true);
            var origX = coord.x + 20;
            var origY = coord.y - 40;
            particle.set({
                x: origX,
                y: origY + 40
            });
            Tween.get(particle)
                .to({
                    y: origY
                }, 850, Ease.backOut);
            _this.layers.particles.addChild(particle);
            if (typeof fn === 'function') {
                fn(particle);
            }
        });
    }
};

Client.prototype.showDamage = function(unit, damage) {
    var _this = this;
    var spacing = 0;
    _.each(String(damage).split(''), function(numeral, i) {
        _this.createSprite('n-' + numeral, function(err, sprite) {
            var posX = unit.container.x + spacing * 0.6;
            var posY = unit.container.y - 80;
            spacing += settings.numberSpacing[numeral];
            sprite.set({
                x: posX,
                y: posY + Math.random() * 50,
                alpha: 0
            });
            _this.layers.terrain.addChild(sprite);
            Tween.get(sprite)
            .wait(i * 80)
            .to({
                x: posX,
                y: posY - 20,
                alpha: 1
            }, 400, Ease.backOut)
            .wait(2000)
            .to({
                y: posY + 20,
                alpha: 0
            }, 500, Ease.quartIn)
            .call(function() {
                sprite.parent.removeChild(sprite);
            });
        });
    });
};

Client.prototype.createTiles = function(name, tiles, callback) {
    var _this = this;
    _.each(tiles, function(tile, i) {
        _this.createSprite(name, function(err, tileSprite) {
            HexUtil.position(tileSprite, tile);
            _this.layers.tiles.addChild(tileSprite);
            callback(null, tileSprite, tile, i);
        });
    });
};

Client.prototype.createTile = function(name, tile, callback) {
    var _this = this;
    _this.createSprite(name, function(err, tileSprite) {
        HexUtil.position(tileSprite, tile);
        _this.layers.tiles.addChild(tileSprite);
        callback(tileSprite);
    });
};

Client.prototype.createAttackLinePath = function(tileA, tileB) {
    var graphics = new createjs.Graphics();
    var linePath = new createjs.Shape(graphics);
    var coordA = HexUtil.coord(tileA, true);
    var coordB = HexUtil.coord(tileB, true);
    graphics
        //.beginStroke('white')
        //.beginFill('white')
        .setStrokeStyle(1, 'round')
        .beginStroke('rgba(255,10,0,0.75)')
        .beginFill('rgba(255,10,0,0.25)')
        .drawEllipse(coordA.x - 13, coordA.y - 7, 30, 15)
        .closePath()
        .drawEllipse(coordA.x - 10, coordA.y - 5, 20, 10)
        ;

    if (coordA.y === coordB.y) {
        graphics
        .mt(coordA.x, coordA.y - 5)
        .lt(coordA.x, coordA.y + 5)
        .lt(coordB.x, coordB.y)
        .closePath()
        ;
    } else {

        graphics
        .mt(coordA.x - 20, coordA.y)
        .lt(coordA.x + 20, coordA.y)
        .lt(coordB.x, coordB.y)
        .closePath()
        ;
    }
    this.layers.tiles.addChild(linePath);
    return linePath;
};

/**
 * Generates a visual path for the unit to walk onto
 * @param {HexTiles} tiles
 * @param {Function} callback
 */
Client.prototype.generateTilePath = function(tiles, callback) {
    var _this = this;
    var tileSprites = [];
    var graphics = new createjs.Graphics();
    var linePath = new createjs.Shape(graphics);

    graphics
        .beginStroke('rgba(0,255,255,0.25)')
        .beginFill('cyan')
        .setStrokeStyle(6, 'round');
    _.each(tiles, function(tile, i) {
        /** Generate sprites **/
        _this.createSprite('hex_move_select', function(err, tileSprite) {
            HexUtil.position(tileSprite, tile);
            _this.layers.tiles.addChild(tileSprite);
            tileSprites.push(tileSprite);
            graphics
                .lineTo(tileSprite.x, tileSprite.y)
                .drawEllipse(tileSprite.x - 10, tileSprite.y - 5, 20, 10)
                .moveTo(tileSprite.x, tileSprite.y);
            /** animate **/
            tileSprite.scaleX = 0;
            tileSprite.scaleY = 0;
            Tween
                .get(tileSprite)
                .wait(i * 40)
                .to({
                    scaleX: 1,
                    scaleY: 1
                }, 200, Ease.backOut);
                if (typeof callback === 'function') {
                    callback(tileSprite, i, tileSprites[i-1], tile);
                }
        });
    });
    this.layers.tiles.addChild(linePath);
    return {
        tileSprites: tileSprites,
        linePath: linePath
    };
};

Client.prototype.spawnUnit = function(unit, tile, callback) {
    var coord;
    if (unit) {
        if (tile) {
            coord = HexUtil.coord(tile, true);
            unit.container.x = coord.x;
            unit.container.y = coord.y;
            unit.move(tile);
            unit.face(tile.x > Game.columns * 0.5 ? 'left' : 'right');
            if (typeof callback === 'function') {
                callback(null, unit);
            }
        }
    }
};

Client.prototype.addUnit = function(id, unit, callback) {
    this._unitList.push(unit);
    this.units[id] = unit;
    callback(null, unit);
};

Client.prototype.removeUnit = function(unit) {
    delete this.units[unit.id];
    this.layers.units.removeChild(unit.container);
};

Client.prototype.getUnit = function(id, callback) {
    var unit = this.units[id];
    if (typeof callback === 'function') {
        if (unit) {
            callback(unit);
        }
    }
    return unit;
};

Client.prototype.getSpriteSheet = function(name, callback) {
    var spriteSheet = this.spriteSheets[name];
    callback(null, spriteSheet);
};

Client.prototype.getTileSpriteName = function(tile) {
    var tileName = 'hex_bg_inset';
    if (_.has(tile, 'attack')) {
        tileName = 'hex_atkup';
    } else if (_.has(tile, 'defense')) {
        tileName = 'hex_defup';
    }
    return tileName;
};

Client.prototype.setTiles = function(tiles, callback) {
    var _this = this, cacheContainer;
    var terrainWidth = HexUtil.WIDTH * settings.columns + (HexUtil.WIDTH * 0.5);
    var terrainHeight = HexUtil.HEIGHT * settings.rows;
    if ((cacheContainer = this.layers.terrain.getChildByName('tileBackgrounds'))) {
        cacheContainer.parent.removeChild(cacheContainer);
    }
    cacheContainer = new createjs.Container();
    tiles.each(function(tile) {
        var tileName = _this.getTileSpriteName(tile);
        var t;
        if (!tile.wall) {
            _this.createSprite(tileName, function(err, tileSprite) {
                HexUtil.position(tileSprite, tile);
                if (_this.debug) {
                    t = new createjs.Text(tile.pos(), "10px Arial", "rgba(255, 255, 255, 0.5)");
                    t.textBaseLine = "ideographic";
                    t.textAlign = 'center';
                    HexUtil.position(t, tile, true);
                    cacheContainer.addChild(t);
                }
                cacheContainer.addChild(tileSprite);
            });
        }
        if (tile.type) {
            _this.createFGElement(tile.type, tile);
        }
    });
    cacheContainer.cache(0, 0, terrainWidth, terrainHeight);
    cacheContainer.name = 'tileBackgrounds';
    this.layers.terrain.addChild(cacheContainer);
    this.layers.terrain.addChild(this.layers.tiles); // make sure it's on top :)
    this.layers.terrain.addChild(this.layers.units); // make sure it's on top :)
    this.layers.terrain.addChild(this.layers.particles); // make sure it's on top :)
    this.layers.terrain.x = settings.terrainX;
    this.layers.terrain.y = settings.terrainY;
    if (typeof callback === 'function') {
        setTimeout(function() {
            cacheContainer.cache(0, 0, terrainWidth, terrainHeight);
        },250);
        callback(tiles);
    }
};

Client.prototype.render = function() {
    this.stage.update();
};

Client.prototype.setTimers = function(callback) {
    //createjs.Ticker.addEventListener('tick', this.render.bind(this));
    createjs.Ticker.addListener(this.render.bind(this));
    createjs.Ticker.setFPS(30);
    callback();
};

Client.prototype.setBackground = function(backgroundImage, callback) {
    this.layers.background = new createjs.Bitmap(backgroundImage);
    this.stage.addChild(this.layers.background);
    callback(null, this.layers.background);
};

Client.prototype.initializeLayers = function(callback) {
    this.layers.terrain = new createjs.Container();
    this.layers.tiles = new createjs.Container();
    this.layers.units = new createjs.Container();
    this.layers.particles = new createjs.Container();
    this.layers.terrain.addChild(this.layers.tiles);
    this.layers.terrain.addChild(this.layers.units);
    this.layers.terrain.addChild(this.layers.particles);
    this.stage.addChild(this.layers.terrain);
    callback(null);
};

Client.prototype.resource = function(uri, callback) {
    var resource = this.preloader.getResource(uri);
    if (resource) {
        callback(null, resource);
    } else {
        callback(new Error('The resource', uri, 'is not found'));
    }
};

Client.prototype.play = function() {
    createjs.Ticker.setPaused(false);
};

Client.prototype.pause = function() {
    createjs.Ticker.setPaused(true);
};

Client.prototype.showUnitInfo = function(entity) {
    this.emit('input:unit:info', entity);
};

Client.prototype.showUnitOptions = function() {
    var _this = this;
    if (!this.layers.unitsDimmer) {
        this.layers.unitsDimmer = new createjs.Shape();
        this.layers.unitsDimmer.graphics
            .beginFill('rgba(0,0,0,0.45)')
            .drawRect(0, 0, this.width, this.height)
            ;
    }

    Tween.get(this.layers.unitsDimmer)
        .to({ alpha: 0 })
        .to({ alpha: 1 }, 200)
    ;

    _.each(this._unitList, function(unit, i) {
        unit.infoButton.visible = true;
        _this.layers.terrain.addChild(unit.infoButton);
        unit.infoButton.x = unit.container.x;
        unit.infoButton.y = unit.container.y;
        Tween.get(unit.infoButton)
            .to({ scaleX: 0, scaleY: 0 })
            .wait(i * 20)
            .to({ scaleX: 1, scaleY: 1 }, 500, Ease.backInOut)
        ;
    });

    this.layers.tiles.visible = false;
    this.layers.units.mouseEnabled = false;

    this.stage.addChildAt(this.layers.unitsDimmer, 1);

};

Client.prototype.hideUnitOptions = function() {
    if (this.layers.unitsDimmer) {
        this.layers.unitsDimmer.parent.removeChild(this.layers.unitsDimmer);
        _.each(this._unitList, function(unit) {
            unit.infoButton.visible = false;
        });
    }
    this.layers.units.mouseEnabled = true;
    this.layers.tiles.visible = true;
};


Client.create = function(game, callback) {
    var client = new Client(game);
    callback(null, client);
};

module.exports = Client;

})()
},{"events":2,"./Preloader":11,"./hexutil":12,"./frames/frames":21,"../game/game":36,"./settings":4,"./unit-classes/marine":27,"./unit-classes/vanguard":29,"./unit-classes/powernode":30,"./frame-data-offset":13,"../game/wait":14,"underscore":40}],39:[function(require,module,exports){var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var Game = require('../game/game');
var unitTypes = require('../game/unit-types');

/** server simulator **/
function serverEmulator(socket, level) {
    var game = Game.create();
    var routes = new EventEmitter();

    game.loadMap(level);

    routes.on('unit:move', function unitMove(data) {
        game.getEntity(data.id, function(entity) {
            game.tiles.get(data.x, data.y, function(tile) {
                game.moveEntity(entity, tile, data.sync);
                entity.stats.get('actions').reduce();
                game.checkCurrentTurn();
            });
        });
    });

    routes.on('unit:create', function unitCreate(data) {
        // { id: 'unit1', c: 'create', type: 'marine', x: 0, y: 0}
        var unitType = unitTypes[data.type];
        if (unitType) {
            game.getEntity(data.id, function(entity) {
                game.spawnEntity({
                    id: _.uniqueId('unit'),
                    type: data.type,
                    attributes: unitTypes[data.id],
                    x: data.x,
                    y: data.y
                });
                entity.stats.get('actions').empty();
                game.checkCurrentTurn();
            });
        } else {
            socket.emit('warning', {
                error: 'Unknown entity: ' + data.id,
                message: 'You tried to create an unknown entity. ' +
                    'If you are trying to see loopholes, ' +
                    'please visit http://github.com/jamesflorentino/wolgameclient for its full source code'
            });
        }
    });

    routes.on('unit:act', function unitAct(data) {
        game.getEntity(data.id, function(entity) {
            game.tiles.get(data.x, data.y, function(tile) {
                entity.commands.get(data.command, function(command) {
                    game.getEntity(data.target, function(target) {
                        game.actEntity(entity, tile, command, target);
                        //entity.stats.get('actions').reduce(command.cost);
                        entity.stats.get('actions').empty();
                        game.checkCurrentTurn();
                    });
                });
            });
        });
    });

    routes.on('unit:skip', function() {
        console.log('asdasd');
    });

    game.on('unit:add', function(entity) {
        socket.emit('unit/turn', {
            c: 'create',
            id: entity.id,
            target: entity.type,
            x: entity.tile.x,
            y: entity.tile.y
        });
    });

    game.on('unit:move', function(entity, sync) {
        socket.emit('unit/turn', {
            c: 'move',
            id: entity.id,
            x: entity.tile.x,
            y: entity.tile.y,
            sync: sync
        });
    });

    game.on('unit:act', function(data) {
        socket.emit('unit/turn', {
            c: 'act',
            id: data.id,
            x: data.x,
            y: data.y,
            targets: data.targets,
            results: data.results,
            type: data.type
        });
    });

    game.on('unit:enable', function(entity) {
        socket.emit('unit/turn', {
            c: 'enable',
            id: entity.id,
            x: entity.tile.x,
            y: entity.tile.y
        });
    });

    game.on('unit:disable', function(entity) {
        socket.emit('unit/turn', {
            c: 'disable',
            id: entity.id,
            x: entity.tile.x,
            y: entity.tile.y
        });
    });

    socket.on('unit:turn', function(data) {
        var c = data.c; // [skip|move|act|create] - type of action
        var id = data.id; // id of the originating entity or the name of the requested unit in create mode
        var x = data.x; // x coordinate of the targetted tile
        var y = data.y; // y coordinate of the targetted tile
        var target = data.target; // id of the targetted unit
        game.getTurnID(function(entity) {
            if (entity && entity.id === id) {
                routes.emit('unit:' + c, data);
            } else {
                socket.emit('warning', {
                    error: 'Invalid Turn: ' + data.id,
                    message: 'Y U MANUALLY SEND Packets to server? u_u ' +
                        'If you are trying to see loopholes, ' +
                        'please visit http://github.com/jamesflorentino/wolgameclient for its full source code'
                });
            }
        });
    });

    function spawnUnitAtRandomRow(side, type) {
        var attemptLimits = 15;

        function findAvailableTile(fn) {
            var x = side === 'left' ? 0 : Game.columns - 1;
            var tile;
            var tiles = [];
            _(Game.rows).times(function(y) {
                tiles.push(game.tiles.get(x, y));
            });
            tiles = _.filter(tiles, function(tile) {
                return tile.entities.length === 0;
            });
            if (tiles.length > 0) {
                tile = tiles[_.random(tiles.length - 1)];
                if (typeof fn === 'function') {
                    if (tile) {
                        fn(tile);
                    }
                }
            }
            return tile;
        }

        findAvailableTile(function(tile) {
            routes.emit('unit:create', {
                c: 'create',
                id: type,
                x: tile.x,
                y: tile.y
            });
        });
    }

    function test() {
        var totalTime = 0;
        this.wait = function(time, fn) {
            time = typeof time === 'number' ? time : 1000;
            totalTime += time;
            setTimeout(fn, totalTime);
            return this;
        };

        this.spawn = function spawn(time) {
            return this.wait(time, function() {
                game.spawnEntity({
                    id: _.uniqueId('unit'),
                    type: 'powernode',
                    attributes: unitTypes['powernode'],
                    x: 1,
                    y: 3
                });
                
                game.spawnEntity({
                    id: _.uniqueId('unit'),
                    type: 'powernode',
                    attributes: unitTypes['powernode'],
                    x: 9,
                    y: 3
                });

                game.spawnEntity({
                    id: _.uniqueId('unit'),
                    type: 'marine',
                    attributes: unitTypes['marine'],
                    x: 0,
                    y: 3
                });
                game.spawnEntity({
                    id: _.uniqueId('unit'),
                    type: 'vanguard',
                    attributes: unitTypes['vanguard'],
                    x: 2,
                    y: 2
                });
                
                game.spawnEntity({
                    id: _.uniqueId('unit'),
                    type: 'marine',
                    attributes: unitTypes['marine'],
                    x: 2,
                    y: 3
                });

                game.spawnEntity({
                    id: _.uniqueId('unit'),
                    type: 'vanguard',
                    attributes: unitTypes['vanguard'],
                    x: 3,
                    y: 3
                });
                //routes.emit('unit:create', {
                //    c: 'create',
                //    id: 'marine',
                //    x: 0,
                //    y: 4
                //});
                //routes.emit('unit:create', {
                //    c: 'create',
                //    id: 'marine',
                //    x: 3,
                //    y: 3
                //});
            });
        };

        this.move = function move(time) {
            return this.wait(time, function() {
                var entity, tile;
                entity = game.entities[game.entities.length-1];
                tile = game.tiles.get(Game.columns - 2, Math.floor(Game.rows * 0.5));
                routes.emit('unit:move', {
                    id: entity.id,
                    x: tile.x,
                    y: tile.y
                });
            });
        };

        this.attack = function attack(time) {
            return this.wait(time, function() {
                var entity, target, tile, command;
                entity = game.entities[0];
                target = game.entities[1];
                tile = game.tiles.get(target.tile.x, target.tile.y);
                command = entity.commands.at(0);
                routes.emit('unit:act', {
                    id: entity.id,
                    x: tile.x,
                    y: tile.y,
                    target: target.id,
                    command: command.id
                });
            });
        };

        this.correctpos = function(time) {
            return this.wait(time, function() {
                var entity, tile;
                entity = game.entities[1];
                tile = game.tiles.get(entity.tile.x, entity.tile.y);
                routes.emit('unit:move', {
                    id: entity.id,
                    x: 4,
                    y: 4,
                    sync: true
                });    
            });
        };

        this.setTurn = function(time) {
            return this.wait(time, function() {
                game.setTurn(game.entities[0]);
            });
        };

        this.nextTurn = function(time) {
            return this.wait(time, function() {
                game.nextTurn();
            });
        };

        return this;
    }

    test().spawn(100)
        //.setTurn(100)
        .nextTurn(1000)
        //.correctpos(500)
        //.move(1000)
        //.attack(500)
        ;
}

module.exports = serverEmulator;

},{"events":2,"../game/game":36,"../game/unit-types":9,"underscore":40}]},{},[35]);