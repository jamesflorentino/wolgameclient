var EventEmitter = require('events').EventEmitter;
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
