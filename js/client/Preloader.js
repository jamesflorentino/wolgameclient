/*global createjs*/
var Preloader = function() {
    this.manifest = [];
};

Preloader.prototype.load = function(manifest, callback) {
    var queue = new createjs.LoadQueue();
    this.queue = queue;
    queue.addEventListener('complete', function() {
        callback(null);
    });
    queue.loadManifest(manifest);
};

Preloader.prototype.getResource = function(idOrURL) {
    return this.queue.getResult(idOrURL);
};

module.exports = Preloader;
