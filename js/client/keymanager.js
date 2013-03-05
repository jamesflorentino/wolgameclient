var EventEmitter = require('events').EventEmitter;
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
