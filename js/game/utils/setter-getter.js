var SetterGetter = function() {
};

SetterGetter.prototype.set = function(keys) {
    if (typeof keys === 'object') {
        for(var key in keys) {
            this[key] = keys[key];
        }
    }
};
