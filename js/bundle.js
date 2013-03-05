;(function(e,t,n,r){function i(r){if(!n[r]){if(!t[r]){if(e)return e(r);throw new Error("Cannot find module '"+r+"'")}var s=n[r]={exports:{}};t[r][0](function(e){var n=t[r][1][e];return i(n?n:e)},s,s.exports)}return n[r].exports}for(var s=0;s<r.length;s++)i(r[s]);return i})(typeof require!=="undefined"&&require,{1:[function(require,module,exports){var HexUtil = {
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

},{}],2:[function(require,module,exports){module.exports = {
    backgroundURI: '/media/backgrounds/teal.png',
    terrainURI: '/media/terrains/gravel.png',
    terrainX: 0,
    terrainY: 100,
    rows: 8,
    columns: 16
};

},{}],3:[function(require,module,exports){module.exports = {
    MAC_ENTER: 3,
    BACKSPACE: 8,
    TAB: 9,
    ENTER: 13,
    SHIFT: 16,
    CTRL: 17,
    ALT: 18,
    CAPS_LOCK: 20,
    ESC: 27,
    SPACE: 32,
    END: 35,         // also NUM_SOUTH_WEST
    HOME: 36,        // also NUM_NORTH_WEST
    LEFT: 37,        // also NUM_WEST
    UP: 38,          // also NUM_NORTH
    RIGHT: 39,       // also NUM_EAST
    DOWN: 40,        // also NUM_SOUTH
    ZERO: 48,
    ONE: 49,
    TWO: 50,
    THREE: 51,
    FOUR: 52,
    FIVE: 53,
    SIX: 54,
    SEVEN: 55,
    EIGHT: 56,
    NINE: 57,
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    H: 72,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    U: 85,
    V: 86,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90,
    DASH: 189,                 // needs localization
    EQUALS: 187,               // needs localization
    COMMA: 188,                // needs localization
    PERIOD: 190,               // needs localization
    SLASH: 191,                // needs localization
    APOSTROPHE: 192,           // needs localization
    TILDE: 192,                // needs localization
    SINGLE_QUOTE: 222,         // needs localization
    OPEN_SQUARE_BRACKET: 219,  // needs localization
    BACKSLASH: 220,            // needs localization
    CLOSE_SQUARE_BRACKET: 221, // needs localization
    MAC_FF_META: 224, // Firefox (Gecko) fires this for the meta key instead of 91
    PHANTOM: 255
};

},{}],4:[function(require,module,exports){var EventEmitter = require('events').EventEmitter;
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

},{"events":5}],6:[function(require,module,exports){var Game = require('./game/game');

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

},{"./game/game":7}],8:[function(require,module,exports){module.exports = {
    marine: require('../sheets/marine'),
    vanguard: require('../sheets/vanguard'),
    common: require('../sheets/common')
};

},{"../sheets/marine":9,"../sheets/vanguard":10,"../sheets/common":11}],12:[function(require,module,exports){// shim for using process in browser

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

},{}],5:[function(require,module,exports){(function(process){if (!process.EventEmitter) process.EventEmitter = function () {};

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
},{"__browserify_process":12}],9:[function(require,module,exports){module.exports = {
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
    "images": ["/media/marine.png"]
};

},{}],10:[function(require,module,exports){module.exports = {
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
    "images": ["/media/vanguard.png"]
};

},{}],11:[function(require,module,exports){module.exports = {
"images": ["/media/common.png"],
"frames": [

    [168, 64, 81, 60], 
    [2, 2, 81, 72], 
    [85, 64, 81, 60], 
    [168, 2, 81, 60], 
    [85, 2, 81, 60]
],
"animations": {
    
        "hex_active":[0], 
        "hex_bg":[1], 
        "hex_move":[2], 
        "hex_move_select":[3], 
        "hex_target":[4]
},
"texturepacker": [
        "SmartUpdateHash: $TexturePacker:SmartUpdate:5d3ccf7ba2e98e3e86954553b26983ad$",
        "Created with TexturePacker (http://www.texturepacker.com) for EasalJS"
]
}

},{}],7:[function(require,module,exports){var HexTiles = require('../tiles/hextiles');

var GameEntity = require('./game-entity');
var Game = function() {
    this.initialize.apply(this, arguments);
};

Game.prototype.entities = null;
Game.prototype._entitiesDict = null;
Game.prototype.tiles = null;

/**
 * @param {Object} options
 */
Game.prototype.initialize = function(options) {
    var columns, rows,
    columns = 10;
    rows = 10;
    if (typeof options === 'object') {
        if (options.columns) {
            columns = options.columns;
        }
        if (options.rows) {
            rows = options.rows;
        }
    }
    this.entities = [];
    this._entitiesDict = {};
    this.tiles = new HexTiles(columns, rows);
};

/**
 * @param {GameEntity} gameEntity
 */
Game.prototype.addEntity = function(gameEntity) {
    if (gameEntity instanceof GameEntity) {
        this.entities.push(gameEntity);
        if (gameEntity.id) {
            this._entitiesDict[gameEntity.id] = gameEntity;
        }
    } else {
        throw(new Error('Not a valid GameEntity'));
    }
};

/**
 * @param {Object} attributes
 * @return GameEntity
 */
Game.prototype.createEntity = function(attributes) {
    return new GameEntity(attributes);
};

module.exports = Game;

},{"../tiles/hextiles":13,"./game-entity":14}],13:[function(require,module,exports){var Tiles = require('./tiles');
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
    } else {
        throw(new Error('tile should be an instance of Tile'));
    }

    return result;
};

/**
 * Finding nearest heuristics
 * @param {object} start
 * @param {object} destination
 * @return {Number}
 */
HexTiles.prototype.euclidean = function(start, destination) {
    var vectorX, vectorY;
    vectorX = Math.pow(start.x - destination.x, 2);
    vectorY = Math.pow(start.y - destination.y, 2);
    return Math.sqrt(vectorX + vectorY);
};


module.exports= HexTiles;

},{"./tiles":15,"./tile":16}],14:[function(require,module,exports){var Stats = require('../stats/stats');
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

},{"../stats/stats":17}],16:[function(require,module,exports){var Tile = function() {
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

},{}],15:[function(require,module,exports){var Tile = require('./tile');

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

},{"./tile":16}],17:[function(require,module,exports){var Stat = require('./stat');

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
};

/**
 * Add an attribute
 * @method add
 * @param {Stat|Object} data
 * @param {String} data2
 */
Stats.prototype.add = function(data, data2) {
    var stat;
    if (data instanceof Stat) {
        stat = data;
    } else if (typeof data === 'object') {
        // { name: 'health', value; 100 }
        if (typeof data.name === 'string' && typeof data.value === 'number') {
            stat = new Stat(data.name, data.value);
        } else {
            // {health: 100}
            this.set(data);
        }
    } else if (typeof data === 'string' && typeof data2 === 'number') {
        // health, 100
        stat = new Stat(data, data2);
    }
    if(stat) {
        this.list.push(stat);
        this._dictionary[stat.name] = stat;
    }
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
                stat.setMax(value);
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
Stats.prototype.toJSON = function() {
    var attr = {};
    for(var i=0; i<this.list.length;i++) {
        var stat = this.list[i];
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
    return this._dictionary[name];
};

module.exports = Stats;

},{"./stat":18}],19:[function(require,module,exports){/**
 * @author James Florentino
 * This file will contain the graphics part
 */
/*jshint laxcomma: true*/

/** SpriteSheet frame data  **/
var hexutil = require('./client/hexutil')
, wol = require('./wol/wol')
, frames = require('./client/frames')
, settings = require('./client/settings')
, keycodes = require('./client/keycodes')
, keymanager = require('./client/keymanager')
, _ = require('underscore')
;

var terrainWidth = hexutil.WIDTH * settings.columns + (hexutil.WIDTH * 0.5);
var terrainHeight = hexutil.HEIGHT * settings.rows;
/** main layers **/
var containers = {
    terrain: null,
    units: null,
    tiles: null
};
var assetManifest = [
    frames.marine.images[0],
    frames.vanguard.images[0],
    frames.common.images[0],
    settings.terrainURI,
    settings.backgroundURI
];

var game;

/** To be defined later **/
var canvas, stage, queue, background, commonSpriteSheet;

/**
 * @return createjs.BitmapAnimation
 */
function createSprite(name) {
    var sheet, animation;
    var frameData = frames[name];
    if (frameData) {
        sheet = new createjs.SpriteSheet(frameData);
        animation = new createjs.BitmapAnimation(sheet);
        animation.gotoAndStop(1);
    }
    return animation;
}

function tick() {
    stage.update();
}

function pause() {
    createjs.Ticker.setPaused(true);
}

function resume() {
    createjs.Ticker.setPaused(false);
}

function getImage(url) {
    return queue.getResult(url);
}

/**
 * Generates the terrain in the map
 * @param {Function} fn
 */
function setTerrain(fn) {
    background = new createjs.Bitmap(getImage(settings.backgroundURI));
    containers.terrain = new createjs.Container();
    containers.units = new createjs.Container();
    containers.tiles = new createjs.Container();
    containers.terrain.addChild(containers.tiles, containers.units);
    stage.addChild(
        background, 
        containers.terrain
    );

    //terrain = new Bitmap(getImage(settings.terrainURI));
    //containers.terrain.addChild(terrain);
    containers.terrain.x = settings.terrainX;
    containers.terrain.y = settings.terrainY;
    console.debug('setTerrain');
    fn();
}

function setTerrainInteraction(fn) {
    var terrain = containers.terrain;
    var startX, panning, minX, maxX;
    maxX = 20;
    minX = canvas.width - terrainWidth - 20;
    //stage.addEventListener('stagemousemove', function(e) {
    //    var tx;
    //    if (panning) {
    //        tx = e.stageX - startX;
    //        tx = Math.min(tx, maxX);
    //        tx = Math.max(tx, minX);
    //        //tx = Math.min(tx, maxX);
    //        //tx = Math.max(tx, minX);
    //        terrain.x = tx;
    //    }
    //});
    //terrain.addEventListener('mousedown', function(e) {
    //    startX = e.stageX - terrain.x;
    //    panning = true;
    //});

    //stage.addEventListener('stagemouseup', function() {
    //    panning = false;
    //});
    fn();
}

function createImageSprite(name) {
    var tileMap;
    if (!commonSpriteSheet) {
        commonSpriteSheet = new createjs.SpriteSheet(frames.common);
    }
    tileMap = new createjs.BitmapAnimation(commonSpriteSheet);
    tileMap.gotoAndStop(name);
    return tileMap;
}

/**
 * Generates the sprited tiles
 * @param {Function} fn
 */
function setTilemaps(fn) {
    var tiles = game.tiles;
    var tileMapBackground = new createjs.Container();
    tiles.each(function(tile) {
        var tileMap = createImageSprite('hex_bg');
        hexutil.position(tileMap, tile);
        tileMapBackground.addChild(tileMap);
    });
    tileMapBackground.cache(0, 0, terrainWidth, terrainHeight);
    containers.tiles.addChild(tileMapBackground);

    console.debug('setTilemaps');
    fn();
}

function setGame(fn) {
    game = wol.createGame({ columns: settings.columns, rows: settings.rows });
    console.debug('setGame');
    fn();
}

function testUnit() {
    var tile = game.tiles.get(0,0);
    var tileCoord = hexutil.coord(tile, true);
    var marine = createSprite('marine');
    marine.x = tileCoord.x;
    marine.y =  tileCoord.y;
    marine.gotoAndPlay('idle');
    containers.units.addChild(marine);

    var unitTileMap = createTileMap(tile, 'hex_active');
    containers.tiles.addChild(unitTileMap);

    /** Test path finding algorithm  **/
    var moveableTiles = game.tiles.neighbors(tile, 3);
    var tileMaps = [];
    var linePath, tileMapsRange;

    var clearPath = function() {
        if (linePath && linePath.parent) {
            linePath.parent.removeChild(linePath);
        }
        while(tileMaps.length) {
            tileMaps[0].parent.removeChild(tileMaps[0]);
            tileMaps.shift();
        }
    };

    var clearRange = function() {
        while(tileMapsRange.length) {
            tileMapsRange[0].parent.removeChild(tileMapsRange[0]);
            tileMapsRange.shift();
        }
    };

    tileMapsRange = createTileMaps(moveableTiles, 'hex_move');

    _.each(tileMapsRange, function(tileMap, i) {
        var t = moveableTiles[i];
        tileMap.addEventListener('click', function() {
            clearPath();
            tileMaps = createPath(tile, t);
            var graphics = new createjs.Graphics();
            graphics
                .beginStroke('rgba(0,255,255,0.25)')
                .beginFill('cyan')
                .setStrokeStyle(6, 'round')
                .moveTo(unitTileMap.x, unitTileMap.y)
                .drawEllipse(unitTileMap.x - 10, unitTileMap.y - 5, 20, 10)
                .moveTo(unitTileMap.x, unitTileMap.y)
                ;
            _.each(tileMaps, function(tileMap, i) {
                graphics
                    .lineTo(tileMap.x, tileMap.y)
                    .drawEllipse(tileMap.x - 10, tileMap.y - 5, 20, 10)
                    .moveTo(tileMap.x, tileMap.y)
                    ;
                tileMap.scaleX = tileMap.scaleY = 0;
                createjs.Tween.get(tileMap)
                    .wait(40 * i)
                    .to({
                        scaleY: 1,
                        scaleX: 1
                    }, 350, createjs.Ease.quintOut);
                tileMap.addEventListener('click', function() {
                    clearPath();
                    clearRange();
                });
            });
            linePath = new createjs.Shape(graphics);
            containers.tiles.addChild(linePath);
        });
    });
}

/**
 * @param {Tile} start
 a @param {Tile} end
 * @return {Array}
 */
function createPath(start, end) {
    var path, tileMaps;
    path = game.tiles.findPath(start, end);
    tileMaps = createTileMaps(path, 'hex_move_select');
    return tileMaps;
}

function createTileMap(tile, name) {
    var tileMap;
    tileMap = createImageSprite(name);
    hexutil.position(tileMap, tile);
    return tileMap;
}

/**
 * @param {Array} tiles
 * @param {String} name
 * @param {Function} fn optional
 */
function createTileMaps(tiles, name, fn) {
    var tileMap, tile, tileMaps;
    tileMaps = [];
    for(var i=0; i<tiles.length; i++) {
        tileMap = createImageSprite(name);
        tile = tiles[i];
        hexutil.position(tileMap, tile);
        containers.tiles.addChild(tileMap);
        tileMaps.push(tileMap);
        if (typeof fn === 'function')  {
            fn(tileMap);
        }
    }
    return tileMaps;
}

function start() {
    /** Welcome to the callback-ception. choo choo **/
    setGame(function(err) {
        setTerrain(function(err) {
            setTilemaps(function(err) {
                setTerrainInteraction(function(err) {
                    testUnit();
                    resume();
                });
            });
        });
    });
}

function preload() {
    queue = new createjs.LoadQueue();
    queue.addEventListener('complete', preloadComplete);
    queue.loadManifest(assetManifest);
}

function preloadComplete() {
    start();
}

/**
 * Called when he page is ready
 */
function ready() {
    canvas = document.querySelector('canvas#game');
    stage = new createjs.Stage(canvas);
    createjs.Ticker.addListener(tick);
    createjs.Ticker.setFPS(30);
    preload();
    //pause();
}

window.addEventListener('load', ready);

},{"./client/hexutil":1,"./wol/wol":6,"./client/frames":8,"./client/settings":2,"./client/keycodes":3,"./client/keymanager":4,"underscore":20}],18:[function(require,module,exports){var Stat = function() {
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
Stat.prototype.initialize = function(name, value) {
    this.name = name;
    this.value = this.max = value;
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

module.exports = Stat;

},{}],20:[function(require,module,exports){(function(){//     Underscore.js 1.4.4
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
},{}]},{},[19]);