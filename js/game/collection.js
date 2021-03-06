var Collection = function() {
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
