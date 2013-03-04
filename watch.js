var watch = require('node-watch');
var exec = require('child_process').exec;

function compile() {
    exec('browserify js/main.js -o js/bundle.js', function(err) {
        if (err) {
            console.log('error', err);
        } else {
            console.log('Compiled js/main.js > js/bundle.js');
        }
    });
}

watch('js', function(filename) {
    compile();
});

compile();
